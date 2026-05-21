import type { Metadata } from "next";
import Link from "next/link";
import { getLocaleFromCookie } from "@/lib/i18n.server";
import { getTranslations } from "@/lib/translations";

export const metadata: Metadata = {
  title: "Conditions Générales d'Utilisation – Althea Systems",
  description:
    "Conditions générales régissant l'utilisation de la plateforme Althea Systems et la vente de matériel médical en France.",
};

const LAST_UPDATED = "1er janvier 2026";

export default async function CguPage() {
  const locale = await getLocaleFromCookie();
  const t = getTranslations(locale);

  return (
    <article
      lang="fr"
      dir="ltr"
      className="mx-auto max-w-3xl space-y-4 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-foreground [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-foreground [&_p]:text-sm [&_p]:leading-relaxed [&_p]:text-foreground/70 [&_li]:text-sm [&_li]:leading-relaxed [&_li]:text-foreground/70 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:ps-5"
    >
      <header className="card space-y-2 p-6">
        <h1 className="text-2xl font-semibold text-foreground">{t("legal.cgu.title")}</h1>
        <p className="text-sm text-foreground/70">{t("legal.cgu.subtitle")}</p>
        <p className="text-xs text-foreground/55">Dernière mise à jour : {LAST_UPDATED}</p>
      </header>

      <section className="card space-y-2 p-6">
        <h2>Article 1 — Objet</h2>
        <p>
          Les présentes Conditions Générales d'Utilisation (ci-après les « CGU ») ont pour objet de
          définir les modalités d'accès au site althea-systems.fr (ci-après le « Site ») et les
          conditions dans lesquelles Althea Systems propose à ses clients, professionnels de santé
          comme particuliers, la vente de matériel et de dispositifs médicaux.
        </p>
        <p>
          Toute navigation, création de compte ou commande sur le Site emporte acceptation pleine
          et entière des présentes CGU. L'utilisateur reconnaît en avoir pris connaissance avant
          toute utilisation du Site.
        </p>
      </section>

      <section className="card space-y-2 p-6">
        <h2>Article 2 — Mentions légales</h2>
        <p>
          L'éditeur du Site, son hébergeur et le directeur de la publication sont identifiés dans
          les{" "}
          <Link href="/legal/mentions" className="text-primary hover:underline">
            mentions légales
          </Link>
          . Ces informations font partie intégrante des présentes CGU.
        </p>
      </section>

      <section className="card space-y-2 p-6">
        <h2>Article 3 — Accès au Site</h2>
        <p>
          Le Site est accessible gratuitement à tout utilisateur disposant d'un accès Internet.
          Les frais de matériel, logiciel et de connexion nécessaires à l'accès restent à la charge
          de l'utilisateur.
        </p>
        <p>
          Althea Systems s'efforce de maintenir le Site accessible 7 j / 7 et 24 h / 24, sans
          toutefois y être tenu. L'accès peut être interrompu pour des raisons de maintenance,
          d'évolution technique ou en cas de force majeure, sans que cette interruption ouvre droit
          à indemnité.
        </p>
      </section>

      <section className="card space-y-2 p-6">
        <h2>Article 4 — Compte utilisateur</h2>
        <p>
          La création d'un compte est nécessaire pour passer commande et pour accéder à certaines
          fonctionnalités (suivi de commande, factures, adresses enregistrées). L'utilisateur
          s'engage à fournir des informations exactes, à jour et à préserver la confidentialité de
          ses identifiants.
        </p>
        <p>
          L'utilisateur est seul responsable des actions effectuées depuis son compte. Toute
          utilisation frauduleuse ou suspecte doit être signalée sans délai à{" "}
          <a href="mailto:contact@althea.fr" className="text-primary hover:underline">
            contact@althea.fr
          </a>
          .
        </p>
      </section>

      <section className="card space-y-2 p-6">
        <h2>Article 5 — Produits et commandes</h2>
        <p>
          Les produits proposés sur le Site sont décrits avec la plus grande exactitude, sur la base
          des informations communiquées par les fabricants. Les photographies et illustrations sont
          fournies à titre indicatif et n'ont pas valeur contractuelle.
        </p>
        <p>
          Certains produits, en particulier les dispositifs médicaux relevant de l'article L.5211-1
          du Code de la santé publique, ne peuvent être commandés que par des professionnels
          dûment habilités. Althea Systems pourra demander toute pièce justificative et refuser
          une commande qui ne satisferait pas à ces exigences.
        </p>
      </section>

      <section className="card space-y-2 p-6">
        <h2>Article 6 — Prix et paiement</h2>
        <p>
          Les prix affichés sur le Site sont libellés en euros, toutes taxes comprises (TTC) pour
          les particuliers, et hors taxes (HT) pour les acheteurs professionnels avec mention de la
          TVA applicable. Les frais de livraison sont indiqués avant validation de la commande.
        </p>
        <p>
          Le règlement s'effectue en ligne via les moyens de paiement proposés (carte bancaire,
          virement SEPA pour les comptes professionnels). La commande n'est définitivement
          confirmée qu'après validation du paiement par notre prestataire bancaire.
        </p>
      </section>

      <section className="card space-y-2 p-6">
        <h2>Article 7 — Livraison</h2>
        <p>
          Les produits sont expédiés à l'adresse indiquée par le client dans un délai indicatif de
          48 heures ouvrées sur le territoire métropolitain. Tout retard supérieur à 30 jours,
          imputable à Althea Systems, ouvre droit à la résolution de la vente conformément à
          l'article L.216-2 du Code de la consommation.
        </p>
        <p>
          Les risques liés au transport sont transférés au client à la remise effective du colis,
          sauf pour les acheteurs professionnels où le transfert intervient à la remise au
          transporteur.
        </p>
      </section>

      <section className="card space-y-2 p-6">
        <h2>Article 8 — Droit de rétractation</h2>
        <p>
          Conformément aux articles L.221-18 et suivants du Code de la consommation, le
          consommateur dispose d'un délai de quatorze (14) jours à compter de la réception du
          produit pour exercer son droit de rétractation, sans avoir à motiver sa décision.
        </p>
        <p>
          Conformément à l'article L.221-28, le droit de rétractation ne s'applique pas aux
          dispositifs médicaux scellés et descellés après livraison, ne pouvant être renvoyés pour
          des raisons d'hygiène ou de protection de la santé. Les acheteurs professionnels ne
          bénéficient pas du droit de rétractation.
        </p>
      </section>

      <section className="card space-y-2 p-6">
        <h2>Article 9 — Garanties légales</h2>
        <p>
          Tous les produits bénéficient de la garantie légale de conformité (articles L.217-3 et
          suivants du Code de la consommation) et de la garantie contre les vices cachés (articles
          1641 et suivants du Code civil). En cas de défaut, le client peut obtenir la réparation
          ou le remplacement du produit, et à défaut, son remboursement.
        </p>
        <p>
          Une garantie commerciale de deux (2) ans peut s'appliquer en complément ; ses conditions
          sont précisées sur la fiche produit ou dans la documentation jointe.
        </p>
      </section>

      <section className="card space-y-2 p-6">
        <h2>Article 10 — Propriété intellectuelle</h2>
        <p>
          L'ensemble des éléments du Site (textes, images, logos, marques, base de données, code
          source) est protégé par le droit d'auteur, le droit des marques et le droit des bases
          de données. Toute reproduction, représentation ou exploitation, totale ou partielle, sans
          autorisation préalable et écrite d'Althea Systems, est strictement interdite.
        </p>
      </section>

      <section className="card space-y-2 p-6">
        <h2>Article 11 — Données personnelles</h2>
        <p>
          Althea Systems traite les données personnelles des utilisateurs dans le strict respect du
          Règlement (UE) 2016/679 (RGPD) et de la loi n° 78-17 du 6 janvier 1978 modifiée. Les
          données collectées le sont pour la gestion des commandes, la relation client et le respect
          des obligations légales.
        </p>
        <p>
          Conformément aux articles 15 à 22 du RGPD, l'utilisateur dispose d'un droit d'accès, de
          rectification, d'effacement, d'opposition, de limitation et de portabilité de ses données.
          Ces droits s'exercent par courriel à{" "}
          <a href="mailto:contact@althea.fr" className="text-primary hover:underline">
            contact@althea.fr
          </a>{" "}
          ou par courrier au siège social.
        </p>
      </section>

      <section className="card space-y-2 p-6">
        <h2>Article 12 — Cookies</h2>
        <p>
          Le Site utilise des cookies strictement nécessaires à son bon fonctionnement (panier,
          session, sécurité), pour lesquels aucun consentement n'est requis. Tout cookie de mesure
          d'audience ou de personnalisation est soumis au consentement préalable de l'utilisateur,
          recueilli via la bannière dédiée et révocable à tout moment.
        </p>
      </section>

      <section className="card space-y-2 p-6">
        <h2>Article 13 — Responsabilité</h2>
        <p>
          Althea Systems s'engage à fournir un service conforme à la description disponible sur le
          Site. Sa responsabilité ne saurait être engagée en cas de mauvaise utilisation des
          produits, de non-respect des indications du fabricant, ni en cas de dommages résultant de
          la force majeure ou du fait d'un tiers.
        </p>
        <p>
          Pour les acheteurs professionnels, et dans toute la mesure permise par la loi, la
          responsabilité totale d'Althea Systems est limitée au montant TTC de la commande
          concernée.
        </p>
      </section>

      <section className="card space-y-2 p-6">
        <h2>Article 14 — Modification des CGU</h2>
        <p>
          Althea Systems se réserve la possibilité de modifier les présentes CGU à tout moment afin
          d'en adapter le contenu aux évolutions légales, techniques ou commerciales. Les
          conditions applicables à une commande sont celles en vigueur à la date de validation du
          paiement.
        </p>
      </section>

      <section className="card space-y-2 p-6">
        <h2>Article 15 — Médiation et litiges</h2>
        <p>
          En cas de litige, le client est invité à contacter prioritairement le service client
          d'Althea Systems afin de rechercher une solution amiable. À défaut d'accord, et
          conformément à l'article L.612-1 du Code de la consommation, le consommateur peut
          recourir gratuitement au médiateur de la consommation dont les coordonnées seront
          communiquées sur simple demande.
        </p>
        <p>
          La plateforme européenne de règlement en ligne des litiges est par ailleurs accessible à
          l'adresse{" "}
          <a
            href="https://ec.europa.eu/consumers/odr"
            target="_blank"
            rel="noreferrer noopener"
            className="text-primary hover:underline"
          >
            ec.europa.eu/consumers/odr
          </a>
          .
        </p>
      </section>

      <section className="card space-y-2 p-6">
        <h2>Article 16 — Droit applicable et juridiction compétente</h2>
        <p>
          Les présentes CGU sont régies par le droit français. À défaut de résolution amiable, et
          sous réserve des règles impératives applicables aux consommateurs, les tribunaux
          compétents seront ceux du ressort du siège social d'Althea Systems.
        </p>
      </section>
    </article>
  );
}
