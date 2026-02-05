"use client"

import { useState, useRef, useEffect } from "react"
import { receiveTutoringAssistance } from "@/ai/flows/receive-tutoring-assistance"
import { Bot, Loader2, Send, Paperclip, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

interface Message {
  role: "user" | "assistant"
  content: string
}

export default function TutorPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async () => {
    if (input.trim() === "" || isLoading) return

    const newMessages: Message[] = [...messages, { role: "user", content: input }]
    setMessages(newMessages)
    setInput("")
    setIsLoading(true)

    try {
      const result = await receiveTutoringAssistance({ query: input })
      setMessages([...newMessages, { role: "assistant", content: result.response }])
    } catch (error) {
      console.error(error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "The AI tutor is currently unavailable. Please try again later.",
      })
      // Optionally remove the user's message if the API call fails
      setMessages(messages)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };
  
  return (
    <div className="flex h-[calc(100vh-120px)] w-full max-w-4xl mx-auto">
      <Card className="flex flex-col w-full">
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 p-3 rounded-lg">
              <Bot className="w-6 h-6 text-primary" />
            </div>
            <div>
              <CardTitle className="font-headline text-2xl">AI Tutor</CardTitle>
              <CardDescription>Ask a question and get a helpful explanation.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-6">
          {messages.length === 0 && (
            <div className="text-center text-muted-foreground">
              <p>No messages yet. Ask something like:</p>
              <p className="font-medium">"Can you explain photosynthesis?"</p>
            </div>
          )}
          {messages.map((message, index) => (
            <div key={index} className={cn("flex items-start gap-4", message.role === 'user' ? 'justify-end' : 'justify-start')}>
              {message.role === 'assistant' && (
                <Avatar>
                  <AvatarFallback><Bot /></AvatarFallback>
                </Avatar>
              )}
              <div className={cn(
                "max-w-[75%] rounded-lg p-3",
                message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
              )}>
                 {message.role === 'assistant' ? (
                  <div className="prose dark:prose-invert" dangerouslySetInnerHTML={{ __html: message.content }} />
                ) : (
                  <p>{message.content}</p>
                )}
              </div>
              {message.role === 'user' && (
                <Avatar>
                  <AvatarFallback><User /></AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex items-start gap-4">
              <Avatar>
                <AvatarFallback><Bot /></AvatarFallback>
              </Avatar>
              <div className="bg-muted rounded-lg p-3 flex items-center">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </CardContent>
        <div className="p-4 border-t">
          <div className="relative">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your question here..."
              className="pr-24"
              rows={1}
            />
            <div className="absolute top-1/2 right-3 -translate-y-1/2 flex gap-2">
              <Button variant="ghost" size="icon" disabled onClick={() => toast({ title: "Feature not available", description: "Image uploads are not supported in this demo." })}>
                <Paperclip className="h-5 w-5" />
              </Button>
              <Button onClick={handleSendMessage} disabled={isLoading || !input.trim()}>
                <Send className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
