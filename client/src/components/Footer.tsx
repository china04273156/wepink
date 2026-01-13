import { Link } from "wouter";
import { Instagram, Facebook, Twitter, Youtube, Mail, Phone, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function Footer() {
  return (
    <footer className="bg-foreground text-background pt-16 pb-8">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Brand & Newsletter */}
          <div className="space-y-6">
            <Link href="/" className="font-display text-3xl font-black tracking-tighter text-primary">
                WEPINK
            </Link>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Bem-vindos ao seu único e essencial mundo rosa. Produtos desenvolvidos com tecnologia e paixão para realçar sua beleza única.
            </p>
            
            <div className="space-y-2">
              <h4 className="font-bold text-sm uppercase tracking-wider">Fique por dentro</h4>
              <form className="flex gap-2" onSubmit={(e) => e.preventDefault()}>
                <Input 
                  placeholder="Seu e-mail" 
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-primary"
                />
                <Button type="submit" variant="default" className="bg-primary hover:bg-primary/90 text-white">
                  OK
                </Button>
              </form>
            </div>
          </div>

          {/* Links Rápidos */}
          <div>
            <h4 className="font-display font-bold text-lg mb-6 text-primary">Institucional</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link href="/about" className="hover:text-primary transition-colors">Sobre a WePink</Link></li>
              <li><Link href="/terms" className="hover:text-primary transition-colors">Termos e Condições</Link></li>
              <li><Link href="/privacy" className="hover:text-primary transition-colors">Política de Privacidade</Link></li>
              <li><Link href="/shipping" className="hover:text-primary transition-colors">Política de Entrega</Link></li>
              <li><Link href="/returns" className="hover:text-primary transition-colors">Trocas e Devoluções</Link></li>
              <li><a href="#" className="hover:text-primary transition-colors">Rastrear Pedido</a></li>
            </ul>
          </div>

          {/* Categorias */}
          <div>
            <h4 className="font-display font-bold text-lg mb-6 text-primary">Categorias</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link href="/category/perfumaria" className="hover:text-primary transition-colors">Perfumaria</Link></li>
              <li><Link href="/category/body-splash" className="hover:text-primary transition-colors">Body Splash</Link></li>
              <li><Link href="/category/skincare" className="hover:text-primary transition-colors">Skincare</Link></li>
              <li><Link href="/category/maquiagem" className="hover:text-primary transition-colors">Maquiagem</Link></li>
              <li><Link href="/category/kits" className="hover:text-primary transition-colors">Kits Exclusivos</Link></li>
            </ul>
          </div>

          {/* Contato e Suporte */}
          <div>
            <h4 className="font-display font-bold text-lg mb-6 text-primary">Suporte</h4>
            <ul className="space-y-3 text-sm text-muted-foreground mb-6">
              <li><a href="#" className="hover:text-primary transition-colors">Central de Ajuda</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Fale Conosco</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">FAQ</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Dúvidas Frequentes</a></li>
            </ul>
            
            <h4 className="font-display font-bold text-lg mb-6 text-primary">Contato</h4>
            <ul className="space-y-4 text-sm text-muted-foreground">
              <li className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-primary shrink-0" />
                <span>(11) 99999-9999<br/>Seg a Sex: 9h às 18h</span>
              </li>
              <li className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-primary shrink-0" />
                <span>sac@wepink.com.br</span>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-primary shrink-0" />
                <span>São Paulo, SP - Brasil</span>
              </li>
            </ul>
            
            <div className="mt-6 flex gap-4">
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors"><Instagram className="h-5 w-5" /></a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors"><Facebook className="h-5 w-5" /></a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors"><Youtube className="h-5 w-5" /></a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors"><Twitter className="h-5 w-5" /></a>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-muted-foreground">
          <p>© 2026 WePink. Todos os direitos reservados.</p>
          <div className="flex gap-4">
            <span>Pagamento Seguro</span>
            {/* Ícones de pagamento poderiam vir aqui */}
          </div>
        </div>
      </div>
    </footer>
  );
}
