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
import { Loader2, Cpu, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  subject: z.string().min(2, { message: "Subject must be at least 2 characters." }),
  topic: z.string().min(2, { message: "Topic must be at least 2 characters." }),
});

type QuizQuestion = GenerateQuizQuestionsOutput["questions"][0];

export default function QuizPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [quiz, setQuiz] = useState<QuizQuestion[] | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [showResults, setShowResults] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { subject: "", topic: "" },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
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
          description: "Failed to generate quiz. Please try a different topic.",
        });
      }
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerSelect = (answer: string) => {
    const newAnswers = [...userAnswers];
    newAnswers[currentQuestionIndex] = answer;
    setUserAnswers(newAnswers);
  };

  const handleNextQuestion = () => {
    if (quiz && currentQuestionIndex < quiz.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setShowResults(true);
    }
  };

  const resetQuiz = () => {
    setQuiz(null);
    setShowResults(false);
    setUserAnswers([]);
    setCurrentQuestionIndex(0);
    form.reset();
  };

  const score = quiz ? userAnswers.reduce((acc, answer, index) => {
    return answer === quiz[index].correctAnswer ? acc + 1 : acc;
  }, 0) : 0;

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
          {!quiz && !isLoading && (
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
                <Button type="submit" disabled={isLoading} className="w-full animate-pulse-glow">
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Generate Quiz
                </Button>
              </form>
            </Form>
          )}

          {isLoading && (
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
              <Button onClick={handleNextQuestion} disabled={!userAnswers[currentQuestionIndex]} className="w-full">
                {currentQuestionIndex < quiz.length - 1 ? "Next Question" : "Finish Quiz"}
              </Button>
            </div>
          )}

          {showResults && quiz && (
            <div className="space-y-6 animate-in fade-in">
              <h2 className="text-2xl font-headline text-center">Results Analysis</h2>
              <p className="text-center text-4xl font-bold">{score} / {quiz.length}</p>
              <div className="space-y-4">
                {quiz.map((q, i) => (
                  <Card key={i} className={userAnswers[i] === q.correctAnswer ? 'border-green-500 bg-green-500/10' : 'border-red-500 bg-red-500/10'}>
                    <CardHeader>
                      <CardTitle className="text-base font-semibold">{q.question}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">Your answer: {userAnswers[i]}</p>
                      {userAnswers[i] !== q.correctAnswer && <p className="text-sm">Correct answer: {q.correctAnswer}</p>}
                    </CardContent>
                    <CardFooter>
                      {userAnswers[i] === q.correctAnswer ? (
                        <span className="text-sm font-medium text-green-400 flex items-center"><CheckCircle className="w-4 h-4 mr-1"/> Correct</span>
                      ) : (
                        <span className="text-sm font-medium text-red-400 flex items-center"><XCircle className="w-4 h-4 mr-1"/> Incorrect</span>
                      )}
                    </CardFooter>
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
