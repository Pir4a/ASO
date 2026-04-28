import type { Metadata } from "next";
import { getLocaleFromCookie } from "@/lib/i18n.server";
import { getTranslations } from "@/lib/translations";

export const metadata: Metadata = {
  title: "Mentions légales – Althea Systems",
  description:
    "Mentions légales d'Althea Systems : éditeur, hébergeur, propriété intellectuelle, données personnelles et droit applicable.",
};

const LAST_UPDATED = "1er janvier 2026";

export default async function MentionsPage() {
  const locale = await getLocaleFromCookie();
  const t = getTranslations(locale);

  return (
    <article
      lang="fr"
      dir="ltr"
      className="mx-auto max-w-3xl space-y-4 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-foreground [&_p]:text-sm [&_p]:leading-relaxed [&_p]:text-foreground/70 [&_dt]:text-sm [&_dt]:font-semibold [&_dt]:text-foreground [&_dd]:text-sm [&_dd]:text-foreground/70"
    >
      <header className="card space-y-2 p-6">
        <h1 className="text-2xl font-semibold text-foreground">{t("legal.mentions.title")}</h1>
        <p className="text-sm text-foreground/70">{t("legal.mentions.subtitle")}</p>
        <p className="text-xs text-foreground/55">Dernière mise à jour : {LAST_UPDATED}</p>
      </header>

      <section className="card space-y-3 p-6">
        <h2>1. Éditeur du site</h2>
        <p>
          Le présent site althea-systems.fr (ci-après le « Site ») est édité par la société Althea
          Systems, dont les coordonnées sont les suivantes :
        </p>
        <dl className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-[10rem_1fr]">
          <dt>Raison sociale</dt>
          <dd>Althea Systems</dd>

          <dt>Forme juridique</dt>
          <dd>Société par Actions Simplifiée (SAS)</dd>

          <dt>Capital social</dt>
          <dd>50 000 €</dd>

          <dt>Siège social</dt>
          <dd>12 rue de la Santé, 75013 Paris, France</dd>

          <dt>RCS</dt>
          <dd>Paris 902 345 678</dd>

          <dt>SIRET</dt>
          <dd>902 345 678 00012</dd>

          <dt>TVA intracommunautaire</dt>
          <dd>FR12 902345678</dd>

          <dt>Code APE / NAF</dt>
          <dd>4646Z — Commerce de gros de produits pharmaceutiques</dd>

          <dt>Téléphone</dt>
          <dd>
            <a href="tel:+33184801200" className="text-primary hover:underline">
              +33 1 84 80 12 00
            </a>
          </dd>

          <dt>Courriel</dt>
          <dd>
            <a href="mailto:contact@althea.fr" className="text-primary hover:underline">
              contact@althea.fr
            </a>
          </dd>
        </dl>
      </section>

      <section className="card space-y-2 p-6">
        <h2>2. Directeur de la publication</h2>
        <p>
          Le directeur de la publication du Site est le représentant légal d'Althea Systems, en sa
          qualité de Président de la SAS. Il peut être contacté par courriel à l'adresse{" "}
          <a href="mailto:contact@althea.fr" className="text-primary hover:underline">
            contact@althea.fr
          </a>{" "}
          ou par courrier au siège social.
        </p>
      </section>

      <section className="card space-y-3 p-6">
        <h2>3. Hébergeur</h2>
        <p>
          Le Site est hébergé par la société OVH SAS, identifiée comme suit :
        </p>
        <dl className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-[10rem_1fr]">
          <dt>Raison sociale</dt>
          <dd>OVH SAS</dd>
          <dt>Adresse</dt>
          <dd>2 rue Kellermann, 59100 Roubaix, France</dd>
          <dt>Téléphone</dt>
          <dd>+33 9 72 10 10 07</dd>
          <dt>Site web</dt>
          <dd>
            <a
              href="https://www.ovhcloud.com"
              target="_blank"
              rel="noreferrer noopener"
              className="text-primary hover:underline"
            >
              www.ovhcloud.com
            </a>
          </dd>
        </dl>
      </section>

      <section className="card space-y-2 p-6">
        <h2>4. Propriété intellectuelle</h2>
        <p>
          L'intégralité des contenus diffusés sur le Site (textes, photographies, illustrations,
          logos, marques, base de données, code source, mises en page) est la propriété exclusive
          d'Althea Systems ou fait l'objet d'une autorisation d'utilisation.
        </p>
        <p>
          Toute reproduction, représentation, modification, publication ou adaptation totale ou
          partielle des éléments du Site, par quelque procédé que ce soit, est interdite sans
          autorisation écrite préalable d'Althea Systems, et constituerait une contrefaçon
          sanctionnée par les articles L.335-2 et suivants du Code de la propriété intellectuelle.
        </p>
      </section>

      <section className="card space-y-2 p-6">
        <h2>5. Données personnelles</h2>
        <p>
          Les traitements de données à caractère personnel mis en œuvre dans le cadre du Site
          (création de compte, gestion des commandes, facturation, assistance) sont effectués
          conformément au Règlement (UE) 2016/679 (RGPD) et à la loi n° 78-17 du 6 janvier 1978
          modifiée, dite « Informatique et Libertés ».
        </p>
        <p>
          Conformément aux articles 15 à 22 du RGPD, toute personne concernée dispose d'un droit
          d'accès, de rectification, d'effacement, d'opposition, de limitation et de portabilité
          des données la concernant, ainsi que du droit de définir des directives relatives au
          sort de ses données après son décès. Ces droits peuvent s'exercer en écrivant à{" "}
          <a href="mailto:contact@althea.fr" className="text-primary hover:underline">
            contact@althea.fr
          </a>{" "}
          ou par courrier au siège social, en justifiant de son identité.
        </p>
        <p>
          En cas de réclamation non satisfaite, l'utilisateur peut introduire un recours auprès de
          la Commission Nationale de l'Informatique et des Libertés (CNIL), 3 place de Fontenoy,
          TSA 80715, 75334 Paris Cedex 07.
        </p>
      </section>

      <section className="card space-y-2 p-6">
        <h2>6. Cookies</h2>
        <p>
          Le Site utilise des cookies strictement nécessaires à son fonctionnement (panier,
          session, mesure d'audience anonymisée). Tout cookie additionnel, notamment à finalité
          marketing ou de personnalisation, est conditionné au consentement préalable de
          l'utilisateur, exprimé via la bannière dédiée. Le consentement peut être retiré à tout
          moment depuis les préférences de cookies accessibles en pied de page.
        </p>
      </section>

      <section className="card space-y-2 p-6">
        <h2>7. Responsabilité</h2>
        <p>
          Althea Systems met en œuvre tous les moyens raisonnables pour assurer l'exactitude et la
          mise à jour des informations diffusées sur le Site. Elle ne saurait toutefois être tenue
          responsable d'éventuelles erreurs, d'omissions, ou d'une indisponibilité momentanée du
          Site.
        </p>
        <p>
          L'utilisateur est seul responsable de l'usage qu'il fait des informations et des
          produits, en particulier des dispositifs médicaux qui doivent être utilisés conformément
          aux notices et préconisations des fabricants.
        </p>
      </section>

      <section className="card space-y-2 p-6">
        <h2>8. Liens hypertextes</h2>
        <p>
          Le Site peut comporter des liens vers des sites tiers, dont l'éditeur n'a pas le contrôle.
          Althea Systems ne saurait être tenue responsable du contenu de ces sites, ni de l'usage
          qui pourrait en être fait par l'utilisateur.
        </p>
      </section>

      <section className="card space-y-2 p-6">
        <h2>9. Droit applicable</h2>
        <p>
          Les présentes mentions légales sont régies par le droit français. Tout différend né de
          leur interprétation ou de leur exécution sera soumis aux tribunaux français compétents,
          sous réserve des dispositions impératives applicables aux consommateurs.
        </p>
      </section>

      <section className="card space-y-2 p-6">
        <h2>10. Crédits</h2>
        <p>
          Conception, développement et exploitation : équipe Althea Systems. Les marques et
          dénominations citées sur le Site appartiennent à leurs titulaires respectifs et ne sont
          mentionnées qu'à titre informatif.
        </p>
      </section>
    </article>
  );
}
