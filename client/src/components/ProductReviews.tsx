import { useState, useEffect } from "react";
import { Star, User, ThumbsUp, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface Review {
  id: string;
  name: string;
  rating: number;
  comment: string;
  date: string;
  likes: number;
}

interface ProductReviewsProps {
  productId: string;
}

export function ProductReviews({ productId }: ProductReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [newReview, setNewReview] = useState({ name: "", comment: "", rating: 5 });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sortBy, setSortBy] = useState("recent");

  // Carregar avaliações do LocalStorage ou usar dados iniciais
  useEffect(() => {
    const savedReviews = localStorage.getItem(`reviews-${productId}`);
    if (savedReviews) {
      setReviews(JSON.parse(savedReviews));
    } else {
      // Dados iniciais simulados para demonstração
      const initialReviews: Review[] = [
        {
          id: "1",
          name: "Ana Clara",
          rating: 5,
          comment: "Simplesmente apaixonada! O cheiro é maravilhoso e fixa muito bem na pele. Com certeza comprarei novamente.",
          date: new Date(Date.now() - 86400000 * 2).toLocaleDateString(),
          likes: 12
        },
        {
          id: "2",
          name: "Beatriz Silva",
          rating: 4,
          comment: "Produto excelente, chegou super rápido. A embalagem é linda!",
          date: new Date(Date.now() - 86400000 * 5).toLocaleDateString(),
          likes: 5
        }
      ];
      setReviews(initialReviews);
    }
  }, [productId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReview.name || !newReview.comment) {
      toast.error("Por favor, preencha todos os campos.");
      return;
    }

    setIsSubmitting(true);

    // Simular delay de envio
    setTimeout(() => {
      const review: Review = {
        id: Date.now().toString(),
        name: newReview.name,
        rating: newReview.rating,
        comment: newReview.comment,
        date: new Date().toLocaleDateString(),
        likes: 0
      };

      const updatedReviews = [review, ...reviews];
      setReviews(updatedReviews);
      localStorage.setItem(`reviews-${productId}`, JSON.stringify(updatedReviews));
      
      setNewReview({ name: "", comment: "", rating: 5 });
      setIsSubmitting(false);
      toast.success("Avaliação enviada com sucesso!");
    }, 1000);
  };

  const averageRating = reviews.length 
    ? (reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length).toFixed(1) 
    : "0.0";

  const sortedReviews = [...reviews].sort((a, b) => {
    if (sortBy === "recent") {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    } else if (sortBy === "highest") {
      return b.rating - a.rating;
    } else if (sortBy === "lowest") {
      return a.rating - b.rating;
    }
    return 0;
  });

  return (
    <div className="mt-16 border-t pt-12">
      <h2 className="text-2xl font-bold mb-8 uppercase tracking-tight">Avaliações dos Clientes</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
        {/* Resumo das Avaliações */}
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <span className="text-5xl font-black text-primary">{averageRating}</span>
            <div className="flex flex-col">
              <div className="flex text-yellow-400 mb-1">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    className={`w-5 h-5 ${i < Math.round(Number(averageRating)) ? "fill-current" : "text-muted"}`} 
                  />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">{reviews.length} avaliações</span>
            </div>
          </div>

          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = reviews.filter(r => r.rating === star).length;
              const percentage = reviews.length ? (count / reviews.length) * 100 : 0;
              return (
                <div key={star} className="flex items-center gap-2 text-sm">
                  <span className="w-3 font-bold">{star}</span>
                  <Star className="w-3 h-3 text-yellow-400 fill-current" />
                  <Progress value={percentage} className="h-2" />
                  <span className="w-8 text-right text-muted-foreground">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Formulário de Avaliação */}
        <div className="md:col-span-2 space-y-8">
          <form onSubmit={handleSubmit} className="bg-muted/30 p-6 rounded-xl border border-border/50 space-y-4">
            <h3 className="font-bold text-lg">Deixe sua avaliação</h3>
            
            <div className="flex gap-2 mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setNewReview({ ...newReview, rating: star })}
                  className="focus:outline-none transition-transform hover:scale-110"
                >
                  <Star 
                    className={`w-8 h-8 ${star <= newReview.rating ? "text-yellow-400 fill-current" : "text-muted-foreground"}`} 
                  />
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input 
                placeholder="Seu nome" 
                value={newReview.name}
                onChange={(e) => setNewReview({ ...newReview, name: e.target.value })}
                required
              />
            </div>
            
            <Textarea 
              placeholder="O que você achou do produto?" 
              value={newReview.comment}
              onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
              required
              className="min-h-[100px]"
            />

            <Button type="submit" disabled={isSubmitting} className="w-full md:w-auto font-bold">
              {isSubmitting ? "Enviando..." : "Enviar Avaliação"}
            </Button>
          </form>

          {/* Lista de Comentários */}
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b pb-4">
              <h3 className="font-bold text-lg">Comentários ({reviews.length})</h3>
              <div className="flex items-center gap-2">
                <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Ordenar por" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recent">Mais Recentes</SelectItem>
                    <SelectItem value="highest">Maior Nota</SelectItem>
                    <SelectItem value="lowest">Menor Nota</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {sortedReviews.map((review) => (
              <div key={review.id} className="border-b pb-6 last:border-0">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="bg-primary/10 p-2 rounded-full">
                      <User className="w-4 h-4 text-primary" />
                    </div>
                    <span className="font-bold">{review.name}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{review.date}</span>
                </div>
                
                <div className="flex text-yellow-400 mb-2">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      className={`w-4 h-4 ${i < review.rating ? "fill-current" : "text-muted-foreground"}`} 
                    />
                  ))}
                </div>

                <p className="text-muted-foreground leading-relaxed mb-4">
                  {review.comment}
                </p>

                <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors">
                  <ThumbsUp className="w-3 h-3" />
                  Útil ({review.likes})
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
