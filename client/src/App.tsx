import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { CartProvider } from "./contexts/CartContext";
import { WishlistProvider } from "./contexts/WishlistContext";
import { Layout } from "./components/Layout";
import { CartRecovery } from "./components/CartRecovery";
import { ExitIntentPopup } from "./components/ExitIntentPopup";
import Home from "./pages/Home";
import WishlistPage from "./pages/WishlistPage";
import ProductDetail from "./pages/ProductDetail";
import CategoryPage from "./pages/CategoryPage";
import CartPage from "./pages/CartPage";
import CheckoutPageSimple from "./pages/CheckoutPageSimple";
import CheckoutPage from "./pages/CheckoutPage";
import SearchPage from "./pages/SearchPage";
import AllProductsPage from "./pages/AllProductsPage";
import AuthPage from "./pages/AuthPage";
import LoginPageFictitious from "./pages/LoginPageFictitious";
import RegisterPageFictitious from "./pages/RegisterPageFictitious";

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/product/:id" component={ProductDetail} />
        <Route path="/category/:slug" component={CategoryPage} />
        <Route path="/cart" component={CartPage} />
        <Route path="/wishlist" component={WishlistPage} />
        <Route path="/checkout" component={CheckoutPage} />
        <Route path="/auth" component={AuthPage} />
        <Route path="/login" component={LoginPageFictitious} />
        <Route path="/register" component={RegisterPageFictitious} />
        <Route path="/search" component={SearchPage} />
        <Route path="/products" component={AllProductsPage} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <CartProvider>
            <WishlistProvider>
              <Toaster position="top-right" richColors />
            <CartRecovery />
            <ExitIntentPopup />
            <Router />
            </WishlistProvider>
          </CartProvider>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
