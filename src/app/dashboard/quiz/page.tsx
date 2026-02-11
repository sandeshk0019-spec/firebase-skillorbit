
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { generateQuizQuestions, type GenerateQuizQuestionsOutput } from "@/ai/flows/generate-quiz-questions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Loader2, Cpu, CheckCircle, XCircle, Trophy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUser, useFirestore } from "@/firebase";
import { collection, doc, addDoc, serverTimestamp, runTransaction, getDoc, setDoc } from "firebase/firestore";
import { type QuizAttempt, type Activity } from "@/types";
import { achievements } from "@/lib/achievements";
import { updateUserStreak } from "@/lib/streak";
import { awardXp } from '@/lib/xp';
import { xpValues } from '@/lib/rewards';
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";

const formSchema = z.object({
  subject: z.string().min(2, { message: "Subject must be at least 2 characters." }),
  topic: z.string().min(2, { message: "Topic must be at least 2 characters." }),
});

type FormSchema = z.infer<typeof formSchema>;
type QuizQuestion = GenerateQuizQuestionsOutput["questions"][0];

export default function QuizPage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quiz, setQuiz] = useState<QuizQuestion[] | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [showResults, setShowResults] = useState(false);
  
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();

  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: { subject: "", topic: "" },
  });

  const onSubmit = async (values: FormSchema) => {
    setIsGenerating(true);
    setQuiz(null);
    setShowResults(false);
    setUserAnswers([]);
    setCurrentQuestionIndex(0);

    try {
      const result = await generateQuizQuestions({ ...values, numberOfQuestions: 5 });
      if (result.questions && result.questions.length > 0) {
        setQuiz(result.questions);
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to generate quiz. The AI might be unable to create questions for this topic. Please try a different one.",
        });
      }
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred while generating the quiz. Please try again.",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAnswerSelect = (answer: string) => {
    const newAnswers = [...userAnswers];
    newAnswers[currentQuestionIndex] = answer;
    setUserAnswers(newAnswers);
  };

  const score = quiz ? userAnswers.reduce((acc, answer, index) => {
    return answer === quiz[index].correctAnswer ? acc + 1 : acc;
  }, 0) : 0;

  const handleFinishQuiz = async () => {
    if (!quiz || !user || !firestore) return;
    
    setIsSubmitting(true);

    try {
        const userRef = doc(firestore, "users", user.uid);
        const now = serverTimestamp();

        // 1. Save Quiz Attempt
        const quizAttemptData: Omit<QuizAttempt, 'id'> = {
            userId: user.uid,
            subject: form.getValues("subject"),
            topic: form.getValues("topic"),
            score: score,
            totalQuestions: quiz.length,
            createdAt: now as any,
        };
        const attemptsColRef = collection(userRef, "quizAttempts");
        const attemptRef = await addDoc(attemptsColRef, quizAttemptData).catch(error => {
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: attemptsColRef.path,
                operation: 'create',
                requestResourceData: quizAttemptData
            }));
        });

        // 2. Save Activity
        const activityData: Omit<Activity, 'id'> = {
            userId: user.uid,
            type: 'QUIZ_COMPLETED',
            description: `Scored ${score}/${quiz.length} on a quiz about ${quizAttemptData.topic}.`,
            refId: attemptRef?.id,
            createdAt: now as any,
        };
        const activitiesColRef = collection(userRef, "activities");
        addDoc(activitiesColRef, activityData).catch(error => {
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: activitiesColRef.path,
                operation: 'create',
                requestResourceData: activityData
            }));
        });

        // 3. Update User Profile Stats in a Transaction
        runTransaction(firestore, async (transaction) => {
            const userDoc = await transaction.get(userRef);
            if (!userDoc.exists()) {
                throw "User document does not exist!";
            }
            const data = userDoc.data();
            
            const oldTotalQuizzes = data.totalQuizzes || 0;
            const oldTotalCorrect = data.totalCorrectAnswers || 0;
            const oldTotalAnswered = data.totalQuestionsAnswered || 0;

            transaction.update(userRef, {
                totalQuizzes: oldTotalQuizzes + 1,
                totalCorrectAnswers: oldTotalCorrect + score,
                totalQuestionsAnswered: oldTotalAnswered + quiz.length,
            });
        }).catch(error => {
            console.error("Quiz result transaction failed:", error);
            // This is a background task, so we just log the error.
        });
        
        // 4. Award XP
        const xpGained = (score * xpValues.QUIZ_CORRECT_ANSWER) + (score === quiz.length ? xpValues.QUIZ_PERFECT_BONUS : 0);
        awardXp(firestore, user.uid, xpGained, toast);

        // 5. Update Streak & Check for achievements
        updateUserStreak(firestore, user.uid);
        await checkAndUnlockAchievement('FIRST_QUIZ');
        if(score === quiz.length) {
            await checkAndUnlockAchievement('PERFECT_SCORE');
        }

    } catch (error) {
        console.error("Error saving quiz results:", error);
        toast({
            variant: "destructive",
            title: "Submission Error",
            description: "Could not save your quiz results. Please try again.",
        });
    } finally {
        setIsSubmitting(false);
        setShowResults(true);
    }
  }

  const checkAndUnlockAchievement = async (achievementId: keyof typeof achievements) => {
      if (!user || !firestore) return;
      const achRef = doc(firestore, 'users', user.uid, 'achievements', achievementId);
      const achDoc = await getDoc(achRef);

      if (!achDoc.exists()) {
          const achData = achievements[achievementId];
          const achievementData = {
              userId: user.uid,
              achievementId: achievementId,
              unlockedAt: serverTimestamp(),
          };
          setDoc(achRef, achievementData).catch(error => {
              errorEmitter.emit('permission-error', new FirestorePermissionError({
                  path: achRef.path,
                  operation: 'create',
                  requestResourceData: achievementData
              }));
          });
          
          const activityData = {
              userId: user.uid,
              type: 'ACHIEVEMENT_UNLOCKED' as const,
              description: `Unlocked: ${achData.name}`,
              createdAt: serverTimestamp(),
          };
          const activitiesColRef = collection(firestore, 'users', user.uid, 'activities');
          addDoc(activitiesColRef, activityData).catch(error => {
              errorEmitter.emit('permission-error', new FirestorePermissionError({
                  path: activitiesColRef.path,
                  operation: 'create',
                  requestResourceData: activityData
              }));
          });

          toast({
              title: "Achievement Unlocked!",
              description: (
                  <div className="flex items-center gap-3">
                      <Trophy className="w-8 h-8 text-yellow-400" />
                      <div>
                          <p className="font-semibold">{achData.name}</p>
                          <p className="text-xs">{achData.description}</p>
                      </div>
                  </div>
              ),
          });
      }
  };

  const handleNextQuestion = () => {
    if (quiz && currentQuestionIndex < quiz.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      handleFinishQuiz();
    }
  };

  const resetQuiz = () => {
    setQuiz(null);
    setShowResults(false);
    setUserAnswers([]);
    setCurrentQuestionIndex(0);
    form.reset();
  };

  return (
    <div className="container mx-auto max-w-3xl">
      <Card className="bg-card/50">
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 p-3 rounded-lg animate-pulse-glow">
              <Cpu className="w-6 h-6 text-primary" />
            </div>
            <div>
              <CardTitle className="font-headline text-2xl">AI Quiz Matrix</CardTitle>
              <CardDescription>Input subject and topic to generate a custom quiz.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!quiz && !isGenerating && (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subject</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Neuroscience" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="topic"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Topic</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Long-term Potentiation" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={isGenerating} className="w-full animate-pulse-glow">
                  {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Generate Quiz
                </Button>
              </form>
            </Form>
          )}

          {isGenerating && (
            <div className="flex flex-col items-center justify-center text-center p-8">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <p className="font-semibold">Synthesizing knowledge matrix...</p>
              <p className="text-muted-foreground">This may take a moment.</p>
            </div>
          )}

          {quiz && !showResults && (
            <div className="space-y-6 animate-in fade-in">
              <p className="text-sm text-muted-foreground">Question {currentQuestionIndex + 1} of {quiz.length}</p>
              <h2 className="text-xl font-semibold">{quiz[currentQuestionIndex].question}</h2>
              <RadioGroup onValueChange={handleAnswerSelect} value={userAnswers[currentQuestionIndex]} className="gap-4">
                {quiz[currentQuestionIndex].options.map((option, i) => (
                  <Label key={i} className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-muted cursor-pointer has-[input:checked]:bg-primary/20 has-[input:checked]:border-primary transition-colors">
                    <RadioGroupItem value={option} id={`q${currentQuestionIndex}-o${i}`} />
                    <span>{option}</span>
                  </Label>
                ))}
              </RadioGroup>
              <Button onClick={handleNextQuestion} disabled={!userAnswers[currentQuestionIndex] || isSubmitting} className="w-full">
                 {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {currentQuestionIndex < quiz.length - 1 ? "Next Question" : "Finish & Save"}
              </Button>
            </div>
          )}

          {showResults && quiz && (
            <div className="space-y-6 animate-in fade-in">
              <h2 className="text-2xl font-headline text-center">Results Analysis</h2>
              <p className="text-center text-4xl font-bold">{score} / {quiz.length}</p>
              <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                {quiz.map((q, i) => (
                  <Card key={i} className={userAnswers[i] === q.correctAnswer ? 'border-green-500 bg-green-500/10' : 'border-red-500 bg-red-500/10'}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base font-semibold">{i+1}. {q.question}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm">
                      <p className={userAnswers[i] === q.correctAnswer ? 'text-green-400' : 'text-red-400'}>
                          Your answer: {userAnswers[i] || "No answer"}
                      </p>
                      {userAnswers[i] !== q.correctAnswer && <p className="text-green-400">Correct answer: {q.correctAnswer}</p>}
                    </CardContent>
                  </Card>
                ))}
              </div>
              <Button onClick={resetQuiz} className="w-full">Generate Another Quiz</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

    