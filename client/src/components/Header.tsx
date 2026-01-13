import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Search, ShoppingBag, Menu, X, User, ChevronDown, ChevronRight, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useCategories } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { data: categories } = useCategories();
  const [location, setLocation] = useLocation();
  const { items } = useCart();
  const { count: wishlistCount } = useWishlist();

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const query = formData.get("q");
    if (query) {
      setLocation(`/search?q=${query}`);
      setIsSearchOpen(false);
    }
  };

  // Filtrar categorias principais para o menu desktop
  // Removemos "Category", "Sem Categoria" e duplicatas
  const mainCategories = categories
    .filter(c => 
      c.name && 
      !c.name.toLowerCase().includes("category") && 
      !c.name.toLowerCase().includes("sem categoria") &&
      c.hasChildren
    )
    // Remover duplicatas baseadas no nome
    .filter((category, index, self) => 
      index === self.findIndex((t) => t.name === category.name)
    );

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
      {/* Top Bar */}
      <div className="bg-primary text-primary-foreground py-1 text-center text-xs font-medium tracking-wide">
        FRETE GRÁTIS PARA TODO O BRASIL NAS COMPRAS ACIMA DE R$ 199,90
      </div>

      <div className="container flex h-16 items-center justify-between">
        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
            <span className="font-display text-2xl font-black tracking-tighter text-primary cursor-pointer">
              WEPINK
            </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-4 flex-wrap">
          {mainCategories.slice(0, 8).map((category) => (
            <Link key={category.id} href={`/category/${category.url.split('/').pop()}`}>
              <span className="text-xs font-bold hover:text-primary transition-colors uppercase tracking-wide cursor-pointer">
                {category.name}
              </span>
            </Link>
          ))}
          {mainCategories.length > 8 && (
            <div className="relative group">
              <span className="text-xs font-bold hover:text-primary transition-colors uppercase tracking-wide cursor-pointer">Mais</span>
              <div className="absolute left-0 mt-0 w-48 bg-background border border-border rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                {mainCategories.slice(8).map((category) => (
                  <Link key={category.id} href={`/category/${category.url.split('/').pop()}`}>
                    <span className="block px-4 py-2 text-xs font-bold hover:text-primary transition-colors uppercase tracking-wide cursor-pointer hover:bg-muted">
                      {category.name}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsSearchOpen(!isSearchOpen)}
          >
            <Search className="h-5 w-5" />
          </Button>
          
          <Link href="/wishlist">
            <Button variant="ghost" size="icon" className="hidden sm:flex relative">
              <Heart className="h-5 w-5" />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-pink-600 text-[10px] font-bold text-white">
                  {wishlistCount}
                </span>
              )}
            </Button>
          </Link>

          <Link href="/account">
            <Button variant="ghost" size="icon" className="hidden sm:flex">
              <User className="h-5 w-5" />
            </Button>
          </Link>

          <Link href="/cart">
            <Button variant="ghost" size="icon" className="relative">
              <ShoppingBag className="h-5 w-5" />
              {items.length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  {items.length}
                </span>
              )}
            </Button>
          </Link>
        </div>
      </div>

      {/* Search Bar - Always Visible */}
      <div className="hidden md:block bg-background border-b p-3">
        <div className="container max-w-4xl">
          <form onSubmit={handleSearch} className="relative">
            <Input
              name="q"
              placeholder="Digite aqui o que procura..."
              className="pr-10 h-10 text-sm"
            />
            <Button
              type="submit"
              size="icon"
              variant="ghost"
              className="absolute right-0 top-0 h-10 w-10"
            >
              <Search className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
      
      {/* Search Bar Overlay Mobile */}
      {isSearchOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-background border-b p-4 animate-in slide-in-from-top-2">
          <div className="container max-w-2xl">
            <form onSubmit={handleSearch} className="relative">
              <Input
                name="q"
                placeholder="O que você está procurando?"
                className="pr-10 h-12 text-lg"
                autoFocus
              />
              <Button
                type="submit"
                size="icon"
                variant="ghost"
                className="absolute right-0 top-0 h-12 w-12"
              >
                <Search className="h-5 w-5" />
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* Mobile Menu (Accordion Style) */}
      {isMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-background border-b h-[calc(100vh-64px)] overflow-y-auto animate-in slide-in-from-left-2 z-50">
          <nav className="flex flex-col p-4">
            <Accordion type="single" collapsible className="w-full">
              {mainCategories.map((category) => (
                <AccordionItem key={category.id} value={category.id.toString()} className="border-b-border/50">
                  {category.children && category.children.length > 0 ? (
                    <>
                      <AccordionTrigger className="text-lg font-medium py-4 hover:no-underline hover:text-primary uppercase">
                        {category.name}
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="flex flex-col gap-2 pl-4 pb-2">
                          <Link href={`/category/${category.url.split('/').pop()}`}>
                            <span className="block py-2 text-muted-foreground hover:text-primary" onClick={() => setIsMenuOpen(false)}>
                              Ver tudo em {category.name}
                            </span>
                          </Link>
                          {category.children.map((child) => (
                            <Link key={child.id} href={`/category/${child.url.split('/').pop()}`}>
                              <span className="block py-2 text-muted-foreground hover:text-primary" onClick={() => setIsMenuOpen(false)}>
                                {child.name}
                              </span>
                            </Link>
                          ))}
                        </div>
                      </AccordionContent>
                    </>
                  ) : (
                    <Link href={`/category/${category.url.split('/').pop()}`}>
                      <div className="flex flex-1 items-center justify-between py-4 font-medium transition-all hover:text-primary uppercase text-lg" onClick={() => setIsMenuOpen(false)}>
                        {category.name}
                      </div>
                    </Link>
                  )}
                </AccordionItem>
              ))}
            </Accordion>
            
            <div className="mt-6 flex flex-col gap-4">
              <Link href="/products">
                <Button className="w-full justify-start text-lg font-bold uppercase" variant="outline" onClick={() => setIsMenuOpen(false)}>
                  Ver Todos os Produtos
                </Button>
              </Link>
              <Link href="/account">
                <Button className="w-full justify-start text-lg font-medium" variant="ghost" onClick={() => setIsMenuOpen(false)}>
                  <User className="mr-2 h-5 w-5" /> Minha Conta
                </Button>
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
