"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Plus, BarChart2, ScanLine, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from '@/components/ui/scroll-area';
import { apiService } from '@/services/api'; // ← NEW: Import our API service

const formSchema = z.object({
  item: z.string().min(2, "Item name must be at least 2 characters."),
});

type FormValues = z.infer<typeof formSchema>;

interface ShoppingListProps {
  list: string[];
  onAddItem: (item: string) => void;
  onRemoveItem: (item: string) => void;
}

export default function ShoppingList({ list, onAddItem, onRemoveItem }: ShoppingListProps) {
  const [isComparing, setIsComparing] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      item: "",
    },
  });

  const itemValue = form.watch('item');

  useEffect(() => {
    if (itemValue && itemValue.length > 0 && suggestions.length > 0) {
      setPopoverOpen(true);
    } else {
      setPopoverOpen(false);
    }
  }, [suggestions, itemValue]);

  useEffect(() => {
    if (itemValue && itemValue.length > 1) {
      const handleSuggestions = async () => {
        setIsSuggesting(true);
        try {
          // NEW: Use our API service instead of Firebase
          const result = await apiService.suggestItemCompletions(itemValue);
          setSuggestions(result.suggestions || []);
        } catch (e) {
          console.error("Failed to fetch suggestions", e);
          setSuggestions([]);
        } finally {
          setIsSuggesting(false);
        }
      };
      
      const debounce = setTimeout(() => {
        handleSuggestions();
      }, 300);
      
      return () => clearTimeout(debounce);
    } else {
      setSuggestions([]);
    }
  }, [itemValue]);

  const onSubmit: SubmitHandler<FormValues> = (data) => {
    if(data.item){
      onAddItem(data.item);
      form.reset();
      setSuggestions([]);
      setPopoverOpen(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    onAddItem(suggestion);
    form.reset();
    setSuggestions([]);
    setPopoverOpen(false);
  };
  
  const handleComparePrices = () => {
    if (list.length === 0) {
      toast({
        title: "Empty List",
        description: "Add items to your shopping list first to compare prices.",
        variant: "destructive"
      });
      return;
    }
    setIsComparing(true);
    const query = new URLSearchParams({ items: list.join(',') }).toString();
    router.push(`/compare?${query}`);
  };

  return (
    <Card className="shadow-lg border border-primary/20">
      <CardHeader>
        <CardTitle className="font-headline text-2xl">
          My Shopping List
        </CardTitle>
        <CardDescription>Add items to your list, then compare prices across stores.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-start gap-2 mb-6">
            <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
              <PopoverTrigger asChild>
                <div className="flex-grow relative">
                  <FormField
                    control={form.control}
                    name="item"
                    render={({ field }) => (
                      <FormItem className="flex-grow">
                        <FormControl>
                          <Input placeholder="e.g., Albany bread" {...field} className="text-base pr-10"/>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {isSuggesting && <Loader2 className="animate-spin absolute right-3 top-2.5 h-5 w-5 text-muted-foreground" />}
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                  {suggestions.length > 0 && (
                    <ScrollArea className="max-h-72">
                      <ul className="py-1">
                          {suggestions.map((suggestion, index) => (
                              <li
                                  key={index}
                                  className="text-sm px-3 py-2 hover:bg-accent cursor-pointer"
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    handleSuggestionClick(suggestion);
                                  }}
                              >
                                  {suggestion}
                              </li>
                          ))}
                      </ul>
                    </ScrollArea>
                  )}
              </PopoverContent>
            </Popover>
            <Button type="submit" size="icon" aria-label="Add item">
              <Plus />
            </Button>
            <Button type="button" variant="outline" size="icon" aria-label="Scan barcode">
              <ScanLine />
            </Button>
          </form>
        </Form>

        <ul className="space-y-2 mb-6 min-h-[100px]">
          {list.map(item => (
            <li key={item} className="flex items-center justify-between bg-secondary p-3 rounded-md animate-in fade-in-0 zoom-in-95">
              <span className="font-body font-semibold">{item}</span>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive" onClick={() => onRemoveItem(item)} aria-label={`Remove ${item}`}>
                <X className="h-4 w-4" />
              </Button>
            </li>
          ))}
          {list.length === 0 && (
            <p className="text-muted-foreground text-center py-4">Your list is empty. Add some items to begin.</p>
          )}
        </ul>
        
        <div className="flex justify-center border-t border-border pt-6">
          <Button onClick={handleComparePrices} disabled={list.length === 0} size="lg" className="font-headline" loading={isComparing}>
            <BarChart2 className="mr-2 h-4 w-4" />
            Compare Prices
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}