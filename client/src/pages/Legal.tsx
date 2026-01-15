import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Legal() {
  return (
    <div className="min-h-screen bg-muted/50">
      {/* Header */}
      <div className="border-b bg-background">
        <div className="container max-w-4xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold">Mentions légales</h1>
          <p className="text-muted-foreground mt-2">Informations légales et conditions d'utilisation</p>
        </div>
      </div>

      {/* Content */}
      <div className="container max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Éditeur */}
        <Card>
          <CardHeader>
            <CardTitle>Éditeur du site</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <p className="font-semibold">Institut de Formation, d'Animation et de Conseil (IFAC)</p>
              <p className="text-muted-foreground">Ressourcerie IFAC</p>
            </div>
            <div>
              <p className="font-semibold mb-1">Adresse :</p>
              <p className="text-muted-foreground">À compléter avec l'adresse réelle de l'IFAC</p>
            </div>
            <div>
              <p className="font-semibold mb-1">Contact :</p>
              <p className="text-muted-foreground">contact@ressourcerie-ifac.fr</p>
            </div>
            <div>
              <p className="font-semibold mb-1">Téléphone :</p>
              <p className="text-muted-foreground">À compléter</p>
            </div>
          </CardContent>
        </Card>

        {/* Hébergement */}
        <Card>
          <CardHeader>
            <CardTitle>Hébergement</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <p className="font-semibold">Hébergeur :</p>
              <p className="text-muted-foreground">Manus - Plateforme de développement web</p>
            </div>
            <div>
              <p className="font-semibold mb-1">Adresse :</p>
              <p className="text-muted-foreground">À compléter</p>
            </div>
          </CardContent>
        </Card>

        {/* Propriété intellectuelle */}
        <Card>
          <CardHeader>
            <CardTitle>Propriété intellectuelle</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>
              Tous les contenus présents sur le site de la Ressourcerie IFAC (textes, images, vidéos, documents, etc.)
              sont protégés par les lois relatives à la propriété intellectuelle. L'IFAC en est le propriétaire ou
              dispose des droits d'utilisation nécessaires.
            </p>
            <p>
              Toute reproduction, représentation, modification ou exploitation de ces contenus, en tout ou en partie,
              sans l'autorisation préalable de l'IFAC est interdite et constituerait une contrefaçon.
            </p>
            <p>
              Les ressources partagées par les utilisateurs restent la propriété de leurs auteurs respectifs. En
              partageant une ressource, l'utilisateur garantit qu'il dispose des droits nécessaires pour le faire et
              accepte que sa ressource soit utilisée dans le cadre de la Ressourcerie IFAC.
            </p>
          </CardContent>
        </Card>

        {/* Responsabilité */}
        <Card>
          <CardHeader>
            <CardTitle>Responsabilité</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>
              L'IFAC s'efforce de maintenir à jour les informations et les ressources présentes sur la Ressourcerie
              IFAC. Cependant, l'IFAC ne garantit pas l'exactitude, l'exhaustivité ou la pertinence de ces contenus.
            </p>
            <p>
              L'IFAC ne peut être tenue responsable des dommages directs ou indirects résultant de l'utilisation ou de
              l'impossibilité d'utiliser la Ressourcerie IFAC, y compris les pertes de données, les interruptions de
              service ou les erreurs.
            </p>
            <p>
              L'utilisation des ressources de la Ressourcerie IFAC se fait sous la responsabilité de l'utilisateur. Les
              utilisateurs s'engagent à adapter les ressources à leur contexte spécifique et à vérifier leur pertinence
              avant utilisation.
            </p>
          </CardContent>
        </Card>

        {/* Données personnelles */}
        <Card>
          <CardHeader>
            <CardTitle>Protection des données personnelles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>
              La Ressourcerie IFAC collecte et traite les données personnelles conformément au Règlement Général sur la
              Protection des Données (RGPD) et à la loi française relative à la protection des données personnelles.
            </p>
            <p>
              Les données collectées (nom, email, informations de profil) sont utilisées pour :
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Gérer votre compte utilisateur</li>
              <li>Vous envoyer des notifications pertinentes</li>
              <li>Améliorer nos services</li>
              <li>Respecter nos obligations légales</li>
            </ul>
            <p>
              Vous disposez d'un droit d'accès, de rectification, de suppression et de portabilité de vos données
              personnelles. Pour exercer ces droits, veuillez nous contacter à contact@ressourcerie-ifac.fr
            </p>
          </CardContent>
        </Card>

        {/* Cookies */}
        <Card>
          <CardHeader>
            <CardTitle>Cookies</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>
              La Ressourcerie IFAC utilise des cookies pour améliorer votre expérience utilisateur, mémoriser vos
              préférences et analyser l'utilisation du site.
            </p>
            <p>
              Vous pouvez configurer votre navigateur pour refuser les cookies, mais cela peut affecter certaines
              fonctionnalités du site.
            </p>
          </CardContent>
        </Card>

        {/* Conditions d'utilisation */}
        <Card>
          <CardHeader>
            <CardTitle>Conditions d'utilisation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>
              En accédant et en utilisant la Ressourcerie IFAC, vous acceptez les présentes conditions d'utilisation.
              L'IFAC se réserve le droit de modifier ces conditions à tout moment.
            </p>
            <p>Les utilisateurs s'engagent à :</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Respecter les lois et réglementations applicables</li>
              <li>Ne pas partager de contenu offensant, discriminatoire ou illégal</li>
              <li>Ne pas utiliser la plateforme à des fins commerciales sans autorisation</li>
              <li>Respecter la propriété intellectuelle d'autrui</li>
              <li>Ne pas tenter de contourner les mesures de sécurité</li>
            </ul>
          </CardContent>
        </Card>

        {/* Limitation de responsabilité */}
        <Card>
          <CardHeader>
            <CardTitle>Limitation de responsabilité</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>
              L'IFAC ne peut être tenue responsable des contenus partagés par les utilisateurs. Chaque utilisateur est
              responsable des contenus qu'il publie et des conséquences de leur publication.
            </p>
            <p>
              L'IFAC se réserve le droit de modérer, de modifier ou de supprimer tout contenu qui violerait les
              présentes conditions d'utilisation ou les lois applicables.
            </p>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle>Nous contacter</CardTitle>
            <CardDescription>Pour toute question concernant ces mentions légales</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="font-semibold">Email :</span> contact@ressourcerie-ifac.fr
            </p>
            <p>
              <span className="font-semibold">Adresse :</span> À compléter
            </p>
            <p>
              <span className="font-semibold">Téléphone :</span> À compléter
            </p>
          </CardContent>
        </Card>

        {/* Dernière mise à jour */}
        <div className="text-center text-sm text-muted-foreground">
          <p>Dernière mise à jour : 30 décembre 2024</p>
        </div>
      </div>
    </div>
  );
}
