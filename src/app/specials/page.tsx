
import Promotions from '@/components/promotions';

export default function SpecialsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground p-4 sm:p-8 md:p-12">
      <header className="container mx-auto mb-8">
        <h1 className="text-4xl sm:text-5xl font-headline font-bold text-primary">
          Weekly Specials
        </h1>
        <p className="mt-2 text-lg sm:text-xl font-body text-muted-foreground">Check out the latest deals and promotions from our partner stores.</p>
      </header>

      <main className="container mx-auto">
        <div className="max-w-2xl mx-auto">
          <Promotions />
        </div>
      </main>
    </div>
  );
}
