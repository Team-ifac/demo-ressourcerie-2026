import { Link } from "wouter";
import { Mail, MapPin, Phone, Facebook, Twitter, Linkedin, Instagram } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 text-slate-100 mt-20">
      {/* Main Footer Content */}
      <div className="px-4 py-16 bg-gradient-to-b from-slate-900 to-slate-950">
        <div className="container max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 mb-12">
            {/* Column 1: About */}
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold mb-2 text-white">La Ressourcerie IFAC</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Une plateforme de ressources pédagogiques pour l'animation et la formation. Comprendre, animer, transmettre à portée de clic.
                </p>
              </div>
              
              {/* Social Icons */}
              <div className="flex gap-4 pt-4">
                <a 
                  href="#" 
                  className="text-slate-400 hover:text-primary transition-colors"
                  aria-label="Facebook"
                >
                  <Facebook size={20} />
                </a>
                <a 
                  href="#" 
                  className="text-slate-400 hover:text-primary transition-colors"
                  aria-label="Twitter"
                >
                  <Twitter size={20} />
                </a>
                <a 
                  href="#" 
                  className="text-slate-400 hover:text-primary transition-colors"
                  aria-label="LinkedIn"
                >
                  <Linkedin size={20} />
                </a>
                <a 
                  href="#" 
                  className="text-slate-400 hover:text-primary transition-colors"
                  aria-label="Instagram"
                >
                  <Instagram size={20} />
                </a>
              </div>
            </div>

            {/* Column 2: Explorer */}
            <div>
              <h3 className="text-lg font-semibold mb-6 text-white">Explorer</h3>
              <ul className="space-y-3">
                <li>
                  <Link href="/profil/animateur" className="text-slate-400 hover:text-primary transition-colors text-sm block">
                    Animateur·rice
                  </Link>
                </li>
                <li>
                  <Link href="/profil/formateur" className="text-slate-400 hover:text-primary transition-colors text-sm block">
                    Formateur·rice
                  </Link>
                </li>
                <li>
                  <Link href="/profil/directeur" className="text-slate-400 hover:text-primary transition-colors text-sm block">
                    Directeur·rice
                  </Link>
                </li>
                <li>
                  <Link href="/profil/stagiaire" className="text-slate-400 hover:text-primary transition-colors text-sm block">
                    Stagiaire BAFA/BAFD
                  </Link>
                </li>
                <li>
                  <Link href="/resources" className="text-slate-400 hover:text-primary transition-colors text-sm block">
                    Toutes les ressources
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 3: IFAC */}
            <div>
              <h3 className="text-lg font-semibold mb-6 text-white">IFAC</h3>
              <ul className="space-y-3">
                <li>
                  <a 
                    href="https://www.ifac.asso.fr/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-slate-400 hover:text-primary transition-colors text-sm flex items-center gap-2"
                  >
                    Site IFAC
                    <span className="text-xs">↗</span>
                  </a>
                </li>
                <li>
                  <a 
                    href="https://ifac-formation.fr/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-slate-400 hover:text-primary transition-colors text-sm flex items-center gap-2"
                  >
                    IFAC Formation
                    <span className="text-xs">↗</span>
                  </a>
                </li>
                <li>
                  <a 
                    href="https://adhesion.ifac.asso.fr/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-slate-400 hover:text-primary transition-colors text-sm font-semibold flex items-center gap-2 text-primary"
                  >
                    Adhésion IFAC
                    <span className="text-xs">↗</span>
                  </a>
                </li>
                <li>
                  <a href="mailto:contact@ifac.asso.fr" className="text-slate-400 hover:text-primary transition-colors text-sm flex items-center gap-2">
                    <Mail size={16} />
                    Contact
                  </a>
                </li>
                <li>
                  <Link href="/about" className="text-slate-400 hover:text-primary transition-colors text-sm block">
                    À propos
                  </Link>
                </li>
                <li>
                  <Link href="/legal" className="text-slate-400 hover:text-primary transition-colors text-sm block">
                    Mentions légales
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-slate-800 my-8"></div>

          {/* Bottom Section */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-slate-500 text-sm">
            <p>© {currentYear} IFAC. Tous droits réservés.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-slate-300 transition-colors">
                Politique de confidentialité
              </a>
              <a href="#" className="hover:text-slate-300 transition-colors">
                Conditions d'utilisation
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
