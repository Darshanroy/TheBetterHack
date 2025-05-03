
'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetClose } from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sparkles, Bot, User, Send, Mic, X } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// This component uses client-side state and simulates AI interaction.
// Real implementation would involve websockets and backend AI logic.

interface Message {
    sender: 'user' | 'ai';
    text: string;
}

export function FloatingAiAssistant() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isListening, setIsListening] = useState(false); // For voice input simulation
    const scrollAreaRef = useRef<HTMLDivElement>(null);


    // Maintain state across navigation (using localStorage for simplicity)
    // A more robust solution might involve context or state management libraries.
    useEffect(() => {
        const savedMessages = localStorage.getItem('aiAssistantMessages');
        if (savedMessages) {
            setMessages(JSON.parse(savedMessages));
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('aiAssistantMessages', JSON.stringify(messages));
         // Auto-scroll to bottom
        if (scrollAreaRef.current) {
           const scrollViewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
           if(scrollViewport) {
               scrollViewport.scrollTop = scrollViewport.scrollHeight;
           }
        }
    }, [messages]);


    const handleSendMessage = () => {
        if (inputValue.trim() === '') return;

        const newUserMessage: Message = { sender: 'user', text: inputValue };
        setMessages(prev => [...prev, newUserMessage]);
        setInputValue('');

        // Simulate AI response
        setTimeout(() => {
            const aiResponse: Message = { sender: 'ai', text: `I received: "${newUserMessage.text}". As a demo AI, I can help plan purchases or navigate the app.` };
            setMessages(prev => [...prev, aiResponse]);
        }, 1000);
    };

     const handleVoiceInput = () => {
        setIsListening(prev => !prev);
        if (!isListening) {
            // Simulate listening and transcribing
             setInputValue('Simulated voice input: Plan a healthy meal for the week.'); // Example transcription
             setTimeout(() => {
                 setIsListening(false);
                 handleSendMessage(); // Send the simulated transcription
             }, 2000);
        }
    };

    return (
        <>
            {/* Floating Action Button */}
            <Button
                variant="default"
                size="icon"
                className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50 bg-primary hover:bg-primary/90"
                onClick={() => setIsOpen(true)}
                 aria-label="Open AI Assistant"
            >
                <Sparkles className="h-7 w-7 text-primary-foreground" />
            </Button>

            {/* Assistant Sheet */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetContent className="flex flex-col p-0">
                    <SheetHeader className="p-4 border-b">
                        <SheetTitle className="flex items-center gap-2">
                            <Bot className="text-primary"/> AI Assistant
                        </SheetTitle>
                        <SheetDescription>
                            How can I help you today? (Demo)
                        </SheetDescription>
                    </SheetHeader>

                    <ScrollArea className="flex-1 overflow-y-auto p-4" ref={scrollAreaRef}>
                        <div className="space-y-4">
                             {/* Initial Greeting */}
                             {messages.length === 0 && (
                                 <div className="flex gap-3 items-start">
                                     <Avatar className="h-8 w-8 border bg-primary text-primary-foreground">
                                        <AvatarFallback><Bot size={16}/></AvatarFallback>
                                     </Avatar>
                                     <div className="bg-secondary rounded-lg p-3 text-sm max-w-[80%]">
                                         Hello! I'm your FarmConnect assistant. Ask me about planning meals, finding products, or navigating the farmer tools.
                                     </div>
                                 </div>
                             )}

                            {messages.map((message, index) => (
                                <div key={index} className={`flex gap-3 items-start ${message.sender === 'user' ? 'justify-end' : ''}`}>
                                    {message.sender === 'ai' && (
                                        <Avatar className="h-8 w-8 border bg-primary text-primary-foreground">
                                            <AvatarFallback><Bot size={16}/></AvatarFallback>
                                        </Avatar>
                                    )}
                                    <div className={`rounded-lg p-3 text-sm max-w-[80%] ${message.sender === 'user' ? 'bg-accent text-accent-foreground' : 'bg-secondary'}`}>
                                        {message.text}
                                    </div>
                                    {message.sender === 'user' && (
                                        <Avatar className="h-8 w-8 border">
                                             {/* Replace with actual user avatar if available */}
                                            <AvatarFallback><User size={16}/></AvatarFallback>
                                        </Avatar>
                                    )}
                                </div>
                            ))}
                        </div>
                    </ScrollArea>

                    <SheetFooter className="p-4 border-t bg-background">
                        <div className="flex items-center gap-2 w-full">
                            <Textarea
                                placeholder="Type your message..."
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSendMessage();
                                    }
                                }}
                                className="flex-1 resize-none h-10 min-h-10 max-h-24 text-sm p-2"
                                rows={1}
                            />
                             <Button variant={isListening ? "destructive" : "outline"} size="icon" onClick={handleVoiceInput} aria-label={isListening ? "Stop Listening" : "Start Voice Input"}>
                                <Mic className={`h-5 w-5 ${isListening ? 'animate-pulse' : ''}`} />
                             </Button>
                            <Button size="icon" onClick={handleSendMessage} aria-label="Send Message">
                                <Send className="h-5 w-5" />
                            </Button>
                        </div>
                    </SheetFooter>
                     {/* Close button is handled by SheetPrimitive, but if needed: */}
                    {/* <SheetClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background ..."> <X/> </SheetClose> */}
                </SheetContent>
            </Sheet>
        </>
    );
}
