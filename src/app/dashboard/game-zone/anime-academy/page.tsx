'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { BookOpen, XCircle, ChevronRight, Video, Loader2, AlertTriangle, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { generateAnimeVideo } from '@/ai/flows/generate-anime-video';
import { Menubar, MenubarContent, MenubarItem, MenubarMenu, MenubarTrigger } from '@/components/ui/menubar';

const topics = {
  'newtons-third-law': {
    title: 'Newton’s Third Law',
    episode: {
      episodeTitle: "Episode Title: The Unbreakable Bond of Action & Reaction!",
      scenes: [
        {
          title: "Scene 1 – The Problem",
          content: "In a futuristic training dojo, Kaito, a young space cadet, is practicing with a rocket-powered gauntlet.\n\n**Kaito:** (Frustrated) I don't get it! Every time I fire this gauntlet, it pushes me back! How am I supposed to hit a target if I'm thrown off balance? This recoil is a major flaw!",
        },
        {
          title: "Scene 2 – The Conflict",
          content: "A shadowy figure, **General Inertia**, materializes. He’s a giant, immovable golem made of dense energy.\n\n**General Inertia:** (Booming voice) Flaw? No, young one. You face the law of the universe! You believe your action is singular, that your force is a one-way street. That is your weakness. You cannot push the world without it pushing you back!\n\nKaito fires his gauntlet at the General. The blast is powerful, but Kaito is thrown violently backward, while the General doesn't even flinch. Kaito sees his own energy blast being perfectly absorbed and countered by an equal force radiating from the General.",
        },
        {
          title: "Scene 3 – The Power Reveal",
          content: "Master Elara, a wise, floating android, appears beside Kaito.\n\n**Master Elara:** Kaito, you are fighting a fundamental truth. You are not fighting a flaw in your gear; you are fighting the Echo. For every action, there is an equal and opposite reaction. This is Newton's Third Law, the power of **Twin Forces**.\n\nKaito's eyes widen. He looks at his gauntlet, not as a weapon with a recoil problem, but as a propulsion device. The \"kickback\" isn't a bug; it's the other half of the power.\n\n**Kaito:** So... the force that pushes me back... is exactly as strong as the force that shoots the blast?",
        },
        {
          title: "Scene 4 – Victory & Understanding",
          content: "Kaito has a confident smirk. \"I get it now. I can't defeat the law. I have to use it!\"\n\nInstead of bracing against the recoil, Kaito aims his gauntlet behind him. He fires. The powerful \"kickback\" now becomes a powerful forward thrust, launching him at incredible speed. He uses smaller, controlled bursts from his palms to dodge and weave, using the reactions to navigate the air. He flies circles around the stunned General Inertia.\n\n**Master Elara:** (Nodding) He understands. The force is a pair. You can't have one without the other. Use both, and you have balance. You have flight.\n\nGeneral Inertia fades away. Kaito lands perfectly. \"Wow. So every push, every pull, every action... has a twin.\"",
        },
      ],
      summary: {
        coreConcept: "Newton's Third Law states that for every action (force), there is an equal and opposite reaction (force). Forces always come in pairs.",
        shortcut: "Think of it as a \"cosmic push-back.\" If you push on a wall, the wall pushes back on you with the same force. You can't touch without being touched.",
        commonMistake: "Thinking the action and reaction forces cancel each other out. They don't, because they act on *different objects*. The gauntlet pushes the blast (Object 1), and the blast pushes the gauntlet (and Kaito, Object 2).",
      },
      trainingChallenge: "If a tiny satellite and a massive space station push off from each other in space, which one experiences the greater force?",
    }
  },
  'chemical-bonding': {
    title: 'Chemical Bonding',
    episode: {
        episodeTitle: "Episode Title: The Unbreakable Attraction!",
        scenes: [
            {
                title: "Scene 1 – Chaos in Atom City",
                content: "In glowing Atom City, stability is everything… but today, chaos rules. Electrons are running wild.\n\nA **Sodium (Na)** atom appears, its aura flickering violently.\n\n**Sodium:** 'Why do I feel so incomplete? This one electron… it makes me so unstable!'\n\nFrom a distance, a trembling **Chlorine (Cl)** atom watches, its dark green aura pulsing with need.\n\n**Chlorine:** 'I need just one more… or I’ll never be whole.'\n\n⚡ Alarms blare — UNSTABLE ATOMS DETECTED ⚡"
            },
            {
                title: "Scene 2 – The Clash of Needs",
                content: "Na and Cl face each other, energy crackling between them. An electron glows like a blue spirit.\n\n**Na:** 'You’re missing one… I have one extra.'\n\n**Cl:** 'Then give it to me! But know this—once taken, there’s no return.'\n\n**Narrator:** 'When one atom loses and another gains… a powerful force awakens.'\n\nThe electron transfers. A massive shockwave erupts.\n\n💥 **IONIC BOND FORMED** 💥"
            },
            {
                title: "Scene 3 – The Power Reveal",
                content: "A wise figure of pure energy, **Master Elementa**, materializes.\n\n**Master Elementa:** 'You have transformed! Sodium, by giving away your electron, you are now a positive ion, Na+. Chlorine, by accepting it, you are now a negative ion, Cl-. You are complete, but you are also charged.'\n\n**Na+:** 'I feel... lighter. Stable. But I feel this pull...'\n\n**Cl-:** '...a pull towards you. Why?'\n\n**Master Elementa:** 'That is the power of the **Ionic Bond**. Opposites attract. Your charges now bind you with an unbreakable electrostatic force. You have satisfied the **Octet Rule** and formed Sodium Chloride!'"
            },
            {
                title: "Scene 4 – Victory & Understanding",
                content: "Na+ and Cl- are now surrounded by a stable, crystalline aura, moving together in harmony. They no longer flicker or tremble.\n\n**Narrator:** 'Together, they achieved what they could not alone: stability. They formed a new substance, a crystal lattice of salt, strong and orderly.'\n\n**Na+ & Cl- (in unison):** 'We are balanced. We are one.'\n\n**Master Elementa:** 'Remember this. The quest for a full outer shell drives all atoms. The result is a bond that can build worlds.'"
            }
        ],
        summary: {
            coreConcept: "An ionic bond is a chemical bond where one atom transfers electrons to another. This creates oppositely charged ions (a positive metal and a negative nonmetal) that attract each other like magnets.",
            shortcut: "Think 'Givers & Takers.' Metals are givers (lose electrons, become +). Nonmetals are takers (gain electrons, become -). Givers and takers stick together.",
            commonMistake: "Thinking atoms 'share' electrons in an ionic bond. That's a covalent bond! In ionic bonds, it's a complete transfer—one atom loses, the other gains."
        },
        trainingChallenge: "Magnesium (Mg) has two electrons to give. Fluorine (F) only needs one. How many Fluorine atoms are needed to form a stable ionic bond with one Magnesium atom?"
    }
  },
  'flemings-right-hand-rule': {
    title: "Fleming's Right-Hand Rule",
    episode: {
        episodeTitle: "Episode Title: The Conductor's Gauntlet!",
        scenes: [
            {
                title: "Scene 1 – The Unseen Deflection",
                content: "In the high-tech Dynamo Dojo, **Rin**, a young Flux-Weaver, struggles to power a distant crystal. Her energy beam bends away at the last second.\n\n**Rin:** (Frustrated) It's no use! My energy is stable, the crystal is aligned... but something invisible is pushing the current off course. I can't complete the circuit!",
            },
            {
                title: "Scene 2 – The Magnetic Ghost",
                content: "A shimmering, spectral form materializes between Rin and the crystal—the **Magnetic Ghost**. It's a swirling vortex of energy lines.\n\n**Magnetic Ghost:** (A distorted, echoing voice) You cannot control what you cannot predict. Your power is useless if you don't understand the forces that govern it. This is my domain—the domain of the **Field**!\n\nThe Ghost flexes its form, and Rin's next energy beam is violently twisted into a useless spiral.",
            },
            {
                title: "Scene 3 – The Power Reveal",
                content: "Her mentor, **Master Ampere**, appears. He holds up his right hand.\n\n**Master Ampere:** Do not fight the Field, Rin. Command it. The secret lies in your own hand. This is the law of the **Generator Effect**.\n\nHe guides her hand. \"Your **ThuMb** represents **Motion**—the direction you move the conductor. Your **Forefinger** represents the **Field**—the direction of the magnetic force. When you have these two, your **Middle finger** will reveal the direction of the **Current** you will induce!\"",
            },
            {
                title: "Scene 4 – Victory & Understanding",
                content: "Rin's eyes light up. She looks at the Ghost (the Field) and her own potential **Motion**. Instead of firing a static beam, she thrusts her hand forward (**Motion**) through the Ghost's form (**Field**).\n\n**Rin:** \"I'm not just a cannon... I'm a conductor!\"\n\nAs her hand moves, a brilliant arc of energy—the induced **Current**—erupts from her palm, flowing exactly where her middle finger points: straight into the heart of the crystal. The crystal overloads with pure energy, shattering the Magnetic Ghost.\n\n**Master Ampere:** \"You did not overpower the field. You used its own nature, combined with motion, to create the very current you needed. That is true mastery.\"",
            },
        ],
        summary: {
            coreConcept: "Fleming's Right-Hand Rule shows the direction of induced current that flows in a conductor when it moves through a magnetic field.",
            shortcut: "Use your right hand! Point all three fingers at 90° angles to each other. **TH**umb = **TH**rust/Motion. **F**orefinger = **F**ield. **C**enter finger = **C**urrent.",
            commonMistake: "Using your left hand! The Left-Hand Rule is for motors (finding the direction of Force/Motion), while the Right-Hand Rule is for generators (finding the direction of induced Current).",
        },
        trainingChallenge: "If a wire is being pulled downwards through a magnetic field that points from left to right, in which direction will the induced current flow?",
    }
  },
  'cell-division': {
    title: 'Cell Division',
    episode: {
        episodeTitle: "Episode Title: The Mitosis Matrix!",
        scenes: [
            {
                title: "Scene 1 – The Dying Cell",
                content: "Inside the bustling metropolis of a living organism, an old, weary skin cell named Cyto is fading. Its light is dimming.\n\n**Cyto:** (Weakly) My time is... almost over. The barrier will weaken. I must... divide. The code must be passed on!",
            },
            {
                title: "Scene 2 – The Replication Protocol",
                content: "Deep within Cyto's core (the nucleus), twin sets of glowing energy strands (chromosomes) materialize. The DNA has been perfectly copied.\n\n**Narrator:** 'The sacred blueprints of life have been duplicated. Every instruction, every detail, ready for the journey.'\n\nThe nucleus membrane dissolves. The glowing chromosomes, now thick and condensed, float into the cell's center.",
            },
            {
                title: "Scene 3 – The Great Alignment",
                content: "From opposite poles of the cell, shimmering energy tethers (spindle fibers) shoot out and attach to the center of each chromosome pair.\n\n**Master Nucleus:** (A voice of ancient code) The **Metaphase Plate** is set! Align the chronicles! No chromosome left behind!\n\nThe tethers pull with perfect tension, aligning all the chromosome pairs in a single, straight line across the cell's equator. The cell hums with energy, perfectly balanced.",
            },
            {
                title: "Scene 4 – The Separation & Creation",
                content: "The command is given. The tethers shorten, pulling the chromosome pairs apart. Each half—a perfect, identical copy—is dragged to an opposite side of the cell.\n\n**Narrator:** 'The copies are separated. Two new nuclei begin to form, each a perfect mirror of the other. The cell itself begins to pinch in the middle, preparing to become two.'\n\nThe cell membrane constricts, and with a final pulse of light, Cyto splits into two identical, vibrant new cells. The barrier is strong once more.\n\n**New Cells (in unison):** 'The cycle continues. We are the future!'",
            },
        ],
        summary: {
            coreConcept: "Mitosis is the process of cell division where one cell divides into two identical daughter cells. It's essential for growth and repair in the body.",
            shortcut: "Think 'Copy & Split.' The cell copies its DNA, lines it all up in the middle, pulls the copies apart, and then splits down the middle.",
            commonMistake: "Confusing it with Meiosis, which is for creating reproductive cells (sperm and eggs) and results in four cells with half the genetic information.",
        },
        trainingChallenge: "If a cell has 46 chromosomes before mitosis, how many chromosomes will each of the two new daughter cells have?",
    }
  }
};

type TopicKey = keyof typeof topics;

function VideoPlayer({ src }: { src: string }) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const video = videoRef.current;
        if (video) {
            video.load();
            const playPromise = video.play();
            if (playPromise !== undefined) {
                playPromise.catch(err => {
                    // Autoplay was prevented. This is common in modern browsers.
                    // The 'controls' attribute will allow the user to manually start the video.
                    console.warn("Autoplay was prevented. User interaction might be required.", err);
                });
            }
        }
    }, [src]);

    const handleError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
        let errorText = "An unknown video error occurred.";
        switch (e.currentTarget.error?.code) {
            case e.currentTarget.error?.MEDIA_ERR_ABORTED:
                errorText = 'Video playback was aborted.';
                break;
            case e.currentTarget.error?.MEDIA_ERR_NETWORK:
                errorText = 'A network error caused the video download to fail.';
                break;
            case e.currentTarget.error?.MEDIA_ERR_DECODE:
                errorText = 'The video could not be decoded. The file may be corrupt or in an unsupported format.';
                break;
            case e.currentTarget.error?.MEDIA_ERR_SRC_NOT_SUPPORTED:
                errorText = 'Video not found or format is not supported.';
                break;
            default:
                errorText = 'An unexpected error occurred during video playback.';
                break;
        }
        setError(errorText);
    };

    return (
        <div className="aspect-video bg-black rounded-lg overflow-hidden border border-primary/50 relative">
            {error ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                    <AlertTriangle className="w-12 h-12 text-destructive mb-4" />
                    <h3 className="font-headline text-lg text-destructive">Video Playback Error</h3>
                    <p className="text-muted-foreground text-sm">{error}</p>
                    <Card className="mt-4 p-4 bg-muted/50 text-sm text-left">
                        <CardHeader className="p-2">
                          <CardTitle className="text-base">Troubleshooting: Check File Location</CardTitle>
                        </CardHeader>
                        <CardContent className="p-2">
                            <p className="mb-2">The `public` folder must be in the main project directory, not inside `src`.</p>
                            <pre className="text-xs bg-black/50 p-2 rounded-md">
{`[Your Project Folder]/
├── public/
│   └── videos/
│       └── your-video-file.mp4
├── src/
├── package.json
...`}
                            </pre>
                        </CardContent>
                    </Card>
                </div>
            ) : (
                <video
                    ref={videoRef}
                    src={src}
                    controls
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="w-full h-full"
                    onError={handleError}
                />
            )}
        </div>
    );
}


export default function AnimeAcademyPage() {
    const [selectedTopic, setSelectedTopic] = useState<TopicKey | null>(null);
    
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [isVideoLoading, setIsVideoLoading] = useState(false);
    const [videoError, setVideoError] = useState<string | null>(null);

    const episodeData = selectedTopic ? topics[selectedTopic]?.episode : null;
    
    const localVideoPath = selectedTopic === 'chemical-bonding' ? '/videos/chemical-bonding.mp4'
      : selectedTopic === 'flemings-right-hand-rule' ? '/videos/flemings-right-hand-rule.mp4'
      : selectedTopic === 'cell-division' ? '/videos/cell-division.mp4'
      : null;

    const handleGenerateVideo = async () => {
        if (!episodeData) return;
    
        setIsVideoLoading(true);
        setVideoUrl(null);
        setVideoError(null);
    
        const script = episodeData.scenes.map(scene => `**${scene.title}**\n${scene.content}`).join('\n\n');
        
        try {
            const result = await generateAnimeVideo({ script });
            setVideoUrl(result.videoDataUri);
        } catch (error: any) {
            console.error("Video generation failed:", error);
            setVideoError(error.message || "Failed to generate video. The AI model may be busy. Please try again later.");
        } finally {
            setIsVideoLoading(false);
        }
    }
    
    const handleTopicChange = (value: string) => {
      if (value) {
        setSelectedTopic(value as TopicKey);
      } else {
        setSelectedTopic(null);
      }
      setVideoUrl(null);
      setIsVideoLoading(false);
      setVideoError(null);
    }
    
    const resetView = () => {
        setSelectedTopic(null);
        setVideoUrl(null);
        setIsVideoLoading(false);
        setVideoError(null);
    }

    const handleSaveAs = () => {
        if (!videoUrl) return;
        const link = document.createElement("a");
        link.href = videoUrl;
        link.download = `${selectedTopic || "anime-episode"}.mp4`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-120px)] p-4 bg-background text-foreground relative">
      <div className="w-full max-w-4xl z-10">
        <header className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <BookOpen className="w-8 h-8 text-red-500" />
            <div>
              <h1 className="font-headline text-3xl">Anime Academy</h1>
              <p className="text-muted-foreground">Learn Through Epic Stories</p>
            </div>
          </div>
           <Link href="/dashboard/game-zone">
              <Button variant="ghost" size="icon" onClick={resetView}>
                <XCircle className="w-8 h-8" />
              </Button>
            </Link>
        </header>

        <main>
            {!selectedTopic && (
                <Card className="bg-card/50 text-center animate-in fade-in-0 duration-500">
                    <CardHeader>
                        <CardTitle className="font-headline">Select Your Training Arc</CardTitle>
                        <CardDescription>Choose a concept to master through an epic anime narrative.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center gap-4 p-6">
                        <Select onValueChange={handleTopicChange}>
                            <SelectTrigger className="w-[280px]">
                                <SelectValue placeholder="Choose a topic..." />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.entries(topics).map(([key, {title}]) => (
                                    <SelectItem key={key} value={key}>{title}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </CardContent>
                </Card>
            )}

            {selectedTopic && episodeData && (
                 <div className="animate-in fade-in-0 duration-500">
                    <Card className="bg-black/20 backdrop-blur-md border border-white/10">
                        <CardHeader>
                            <Button variant="link" className="text-muted-foreground p-0 h-auto justify-start" onClick={() => handleTopicChange('')}>
                                &larr; Back to Topic Selection
                            </Button>
                            <CardTitle className="font-headline text-2xl text-primary mt-2">{topics[selectedTopic].title}</CardTitle>
                             <CardDescription>{episodeData.episodeTitle}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6 text-center">
                           {localVideoPath ? (
                                <VideoPlayer src={localVideoPath} />
                            ) : isVideoLoading ? (
                                <div className="flex flex-col items-center justify-center p-8 gap-4">
                                    <Loader2 className="w-16 h-16 text-primary animate-spin"/>
                                    <h3 className="font-headline text-xl text-primary">Generating Anime Episode...</h3>
                                    <p className="text-muted-foreground max-w-md">Our AI is rendering your video. This mission can take a couple of minutes. Please wait.</p>
                                </div>
                            ) : videoUrl ? (
                                <div className="space-y-4">
                                    <Menubar className="bg-transparent border-none w-fit mx-auto md:mx-0">
                                        <MenubarMenu>
                                            <MenubarTrigger className="cursor-pointer">File</MenubarTrigger>
                                            <MenubarContent>
                                                <MenubarItem onClick={handleSaveAs} className="cursor-pointer gap-2">
                                                    <Download /> Save As...
                                                </MenubarItem>
                                            </MenubarContent>
                                        </MenubarMenu>
                                    </Menubar>
                                    <div className="aspect-video bg-black rounded-lg overflow-hidden border border-primary/50">
                                        <video src={videoUrl} controls autoPlay className="w-full h-full" />
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center p-8 gap-4">
                                    <Video className="w-16 h-16 text-primary/50"/>
                                    <h3 className="font-headline text-xl">Ready to Watch?</h3>
                                    <p className="text-muted-foreground max-w-md">Click the button below to have our AI generate a unique anime-style video for this lesson.</p>
                                    <Button onClick={handleGenerateVideo} size="lg" className="animate-pulse-glow mt-4" disabled={isVideoLoading}>
                                        <ChevronRight className="mr-2"/>
                                        Generate Video Episode
                                    </Button>
                                     {videoError && (
                                        <Alert variant="destructive" className="mt-4 text-left">
                                            <AlertTitle>Generation Failed</AlertTitle>
                                            <AlertDescription>{videoError}</AlertDescription>
                                        </Alert>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                 </div>
            )}
        </main>
      </div>
    </div>
  );
}
