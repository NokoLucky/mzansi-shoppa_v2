"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Plus, BarChart2, Loader2, Download, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
// import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
// import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { apiService } from '@/services/api';

const formSchema = z.object({
  item: z.string().min(2, "Item name must be at least 2 characters."),
});

type FormValues = z.infer<typeof formSchema>;

interface ShoppingListProps {
  list: string[];
  onAddItem: (item: string) => void;
  onRemoveItem: (item: string) => void;
}

interface ImportedItem {
  name: string;
  quantity?: string;
  category?: string;
}

interface ImportResult {
  items: ImportedItem[];
  confidence: number;
  parsedCount: number;
  suggestions?: string[];
}

export default function ShoppingList({ list, onAddItem, onRemoveItem }: ShoppingListProps) {
  const [isComparing, setIsComparing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importedItems, setImportedItems] = useState<ImportedItem[]>([]);
  const [importText, setImportText] = useState('');
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  
  const { toast } = useToast();
  const router = useRouter();

  // Comment out suggestions state and functionality
  // const [suggestions, setSuggestions] = useState<string[]>([]);
  // const [isSuggesting, setIsSuggesting] = useState(false);
  // const [popoverOpen, setPopoverOpen] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      item: "",
    },
  });

  // Comment out the itemValue watch and suggestions effect
  // const itemValue = form.watch('item');

  // useEffect(() => {
  //   if (itemValue && itemValue.length > 0 && suggestions.length > 0) {
  //     setPopoverOpen(true);
  //   } else {
  //     setPopoverOpen(false);
  //   }
  // }, [suggestions, itemValue]);

  // useEffect(() => {
  //   if (itemValue && itemValue.length > 1) {
  //     const handleSuggestions = async () => {
  //       setIsSuggesting(true);
  //       try {
  //         const result = await apiService.suggestItemCompletions(itemValue);
  //         setSuggestions(result.suggestions || []);
  //       } catch (e) {
  //         console.error("Failed to fetch suggestions", e);
  //         setSuggestions([]);
  //       } finally {
  //         setIsSuggesting(false);
  //       }
  //     };
      
  //     const debounce = setTimeout(() => {
  //       handleSuggestions();
  //     }, 300);
      
  //     return () => clearTimeout(debounce);
  //   } else {
  //     setSuggestions([]);
  //   }
  // }, [itemValue]);

  const onSubmit: SubmitHandler<FormValues> = (data) => {
    if(data.item){
      onAddItem(data.item);
      form.reset();
      // Comment out suggestions reset
      // setSuggestions([]);
      // setPopoverOpen(false);
    }
  };

  // Comment out suggestion click handler
  // const handleSuggestionClick = (suggestion: string) => {
  //   onAddItem(suggestion);
  //   form.reset();
  //   setSuggestions([]);
  //   setPopoverOpen(false);
  // };

  // Import from Notes functionality
  const handleImportFromNotes = async () => {
    if (!importText.trim()) {
      toast({
        title: "Empty text",
        description: "Please paste your shopping list from Notes app.",
        variant: "destructive"
      });
      return;
    }

    setIsImporting(true);
    try {
      const result = await apiService.importGroceryList(importText);
      setImportResult(result);
      setImportedItems(result.items);
      
      toast({
        title: `Found ${result.items.length} items`,
        description: `Review and add them to your list. Confidence: ${Math.round(result.confidence * 100)}%`,
      });
    } catch (error) {
      console.error('Import failed:', error);
      toast({
        title: "Import failed",
        description: "Could not parse your shopping list. Please check the format and try again.",
        variant: "destructive"
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleAddImportedItems = () => {
    if (importedItems.length === 0) return;

    let addedCount = 0;
    importedItems.forEach(item => {
      // Check if item already exists in the list
      if (!list.some(existingItem => 
        existingItem.toLowerCase() === item.name.toLowerCase()
      )) {
        onAddItem(item.name);
        addedCount++;
      }
    });

    toast({
      title: `Added ${addedCount} items`,
      description: addedCount === importedItems.length 
        ? "All imported items added to your list!" 
        : `${importedItems.length - addedCount} items were already in your list.`,
    });

    // Reset import state
    setImportDialogOpen(false);
    setImportText('');
    setImportedItems([]);
    setImportResult(null);
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
        {/* Import from Notes Dialog */}
        <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
          <div className="flex gap-2 mb-4">
            <DialogTrigger asChild>
              <Button variant="outline" className="flex-1">
                <Download className="mr-2 h-4 w-4" />
                Import from Notes
              </Button>
            </DialogTrigger>
          </div>

          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Import from Notes App</DialogTitle>
              <DialogDescription>
                Paste your shopping list from Notes app or any text editor. We'll automatically detect the items.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <Textarea
                placeholder={`Paste your list here...\n\nExample:\nmilk\n2 bread\ncoke 2L\nyogurt 500g\napples\nchicken breast\nrice 1kg\ntomatoes\ncarrots\npotatoes`}
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                className="min-h-[200px] resize-vertical text-base"
              />
              
              <Button 
                onClick={handleImportFromNotes} 
                disabled={!importText.trim() || isImporting}
                className="w-full"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Parsing your list...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Parse Shopping List
                  </>
                )}
              </Button>

              {/* Import Results */}
              {importResult && (
                <div className="border rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="font-semibold">
                      Found {importResult.items.length} items 
                      <span className="text-sm font-normal text-muted-foreground ml-2">
                        ({Math.round(importResult.confidence * 100)}% confidence)
                      </span>
                    </h4>
                    <Button 
                      onClick={handleAddImportedItems}
                      size="sm"
                    >
                      Add All to List
                    </Button>
                  </div>

                  {/* <ScrollArea className="h-[200px]"> */}
                    <div className="space-y-2 pr-4 max-h-[200px] overflow-y-auto">
                      {importedItems.map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-secondary rounded">
                          <div>
                            <span className="font-medium">{item.name}</span>
                            {item.quantity && (
                              <span className="text-sm text-muted-foreground ml-2">
                                ({item.quantity})
                              </span>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (!list.some(existing => existing.toLowerCase() === item.name.toLowerCase())) {
                                onAddItem(item.name);
                                toast({
                                  title: "Item added",
                                  description: `Added ${item.name} to your list`,
                                });
                              }
                            }}
                            disabled={list.some(existing => existing.toLowerCase() === item.name.toLowerCase())}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  {/* </ScrollArea> */}

                  {/* Suggestions */}
                  {importResult.suggestions && importResult.suggestions.length > 0 && (
                    <div className="text-sm text-muted-foreground">
                      <strong>Tips:</strong> {importResult.suggestions.join(' ')}
                    </div>
                  )}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Simplified Form - No Suggestions */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-start gap-2 mb-6">
            {/* Simple input without popover/suggestions */}
            <FormField
              control={form.control}
              name="item"
              render={({ field }) => (
                <FormItem className="flex-grow">
                  <FormControl>
                    <Input 
                      placeholder="e.g., Albany brown bread 700g" 
                      {...field} 
                      className="text-base"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" size="icon" aria-label="Add item">
              <Plus />
            </Button>
          </form>
        </Form>

        {/* Shopping List Items */}
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
        
        {/* Compare Prices Button */}
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