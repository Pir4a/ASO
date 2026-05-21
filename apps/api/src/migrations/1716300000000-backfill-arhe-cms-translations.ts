import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Backfills Arabic + Hebrew translations into the seeded `categories` and
 * `content_blocks` rows so the storefront isn't visibly English when the user
 * picks ar/he. Uses JSONB merge with `||` so existing translations (e.g. the
 * already-seeded `fr`) are preserved and any manual edits in the backoffice
 * are not clobbered.
 *
 * Safe to re-run: each statement only touches the specific row by slug or by
 * matching payload->>'title' (carousel) / type='homepage_text'. Updates are
 * idempotent at the JSONB level because we merge with `||`.
 */
export class BackfillArheCmsTranslations1716300000000 implements MigrationInterface {
  name = 'BackfillArheCmsTranslations1716300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    /* ── Categories ─────────────────────────────────────────── */
    const categoryAr: Record<string, { name: string; description: string }> = {
      'imaging-diagnostics': {
        name: 'التصوير والتشخيص',
        description:
          'أنظمة الرنين المغناطيسي والأشعة المقطعية وأجهزة الموجات فوق الصوتية ومعدات الأشعة السينية لتصوير طبي دقيق.',
      },
      'surgical-operating-room': {
        name: 'الجراحة وغرفة العمليات',
        description:
          'أدوات جراحية ومحطات تخدير وأضواء عمليات ومعدات حقل معقمة.',
      },
      'patient-monitoring': {
        name: 'مراقبة المرضى',
        description:
          'أجهزة مراقبة العلامات الحيوية وأجهزة قياس التأكسج النبضي ومخططات كهربية القلب وأجهزة الرعاية المتصلة.',
      },
      'protective-equipment': {
        name: 'معدات الحماية',
        description: 'قفازات طبية وكمامات وعباءات وواقيات للوجه ومعدات العزل.',
      },
      'mobility-rehabilitation': {
        name: 'التنقل وإعادة التأهيل',
        description: 'كراسي متحركة ومشّايات وجبائر تقويم العظام ومعدات العلاج الطبيعي.',
      },
    };
    const categoryHe: Record<string, { name: string; description: string }> = {
      'imaging-diagnostics': {
        name: 'הדמיה ואבחון',
        description:
          'מערכות MRI, סורקי CT, מכשירי אולטרסאונד וציוד רנטגן להדמיה רפואית מדויקת.',
      },
      'surgical-operating-room': {
        name: 'כירורגיה וחדר ניתוח',
        description:
          'מכשירי ניתוח, עמדות הרדמה, תאורת ניתוח וציוד שדה סטרילי.',
      },
      'patient-monitoring': {
        name: 'ניטור מטופלים',
        description:
          'מוניטורים לסימנים חיוניים, אוקסימטרים, מכשירי אק"ג ופתרונות טיפול מחובר.',
      },
      'protective-equipment': {
        name: 'ציוד מגן',
        description:
          'כפפות רפואיות, מסכות, חלוקים, מגיני פנים וציוד בידוד.',
      },
      'mobility-rehabilitation': {
        name: 'ניידות ושיקום',
        description: 'כיסאות גלגלים, הליכונים, סדים אורתופדיים וציוד פיזיותרפיה.',
      },
    };

    for (const [slug, ar] of Object.entries(categoryAr)) {
      const he = categoryHe[slug];
      const arheJson = JSON.stringify({ ar, he });
      await queryRunner.query(
        `UPDATE categories
            SET translations = COALESCE(translations, '{}'::jsonb) || $1::jsonb
          WHERE slug = $2`,
        [arheJson, slug],
      );
    }

    /* ── Content blocks ─────────────────────────────────────── */

    // homepage_text — single block, identified by type.
    const homepageArHe = {
      ar: {
        headline: 'معدات طبية فاخرة، تُسلَّم بتميز',
        body:
          'شريكك الموثوق لأجهزة ومعدات طبية عالية الجودة. معتمد ISO 13485. شحن سريع في جميع أنحاء أوروبا.',
      },
      he: {
        headline: 'ציוד רפואי מובחר, נשלח במצוינות',
        body:
          'שותפך המהימן לציוד ולמכשירים רפואיים איכותיים. מאושר ISO 13485. משלוח מהיר בכל אירופה.',
      },
    };
    await queryRunner.query(
      `UPDATE content_blocks
          SET payload = payload || jsonb_build_object(
             'translations',
             COALESCE(payload->'translations', '{}'::jsonb) || $1::jsonb
          )
        WHERE type = 'homepage_text'`,
      [JSON.stringify(homepageArHe)],
    );

    // Carousel slides — identified by their seeded EN title.
    const carousels: Array<{
      enTitle: string;
      ar: { title: string; subtitle: string; ctaLabel: string };
      he: { title: string; subtitle: string; ctaLabel: string };
    }> = [
      {
        enTitle: 'New: Digital X-Ray System 100',
        ar: {
          title: 'جديد · نظام الأشعة السينية الرقمي 100',
          subtitle: 'أشعة سينية رقمية مثبتة بالسقف مع معاينة فورية للصور',
          ctaLabel: 'اكتشف',
        },
        he: {
          title: 'חדש · מערכת רנטגן דיגיטלית 100',
          subtitle: 'רנטגן דיגיטלי מותקן בתקרה עם תצוגה מקדימה מיידית',
          ctaLabel: 'גלה',
        },
      },
      {
        enTitle: 'Operating Station 900',
        ar: {
          title: 'محطة العمليات 900',
          subtitle: 'غرفة عمليات متصلة مع إمكانية التتبع في الوقت الحقيقي',
          ctaLabel: 'اعرض المنتج',
        },
        he: {
          title: 'עמדת ניתוח 900',
          subtitle: 'חדר ניתוח מחובר עם מעקב בזמן אמת',
          ctaLabel: 'הצג מוצר',
        },
      },
      {
        enTitle: 'Expert Support & Maintenance',
        ar: {
          title: 'دعم وصيانة من الخبراء',
          subtitle: 'مديرو حسابات مخصصون ومساعدة تقنية على مدار الساعة',
          ctaLabel: 'تواصل معنا',
        },
        he: {
          title: 'תמיכה ותחזוקה של מומחים',
          subtitle: 'מנהלי לקוחות ייעודיים וסיוע טכני 24/7',
          ctaLabel: 'צור קשר',
        },
      },
    ];

    for (const c of carousels) {
      const arheJson = JSON.stringify({ ar: c.ar, he: c.he });
      await queryRunner.query(
        `UPDATE content_blocks
            SET payload = payload || jsonb_build_object(
               'translations',
               COALESCE(payload->'translations', '{}'::jsonb) || $1::jsonb
            )
          WHERE type = 'carousel'
            AND payload->>'title' = $2`,
        [arheJson, c.enTitle],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Strip the ar + he keys we added, but leave any existing locale variants
    // (fr or manual edits) untouched.
    await queryRunner.query(`
      UPDATE categories
         SET translations = translations - 'ar' - 'he'
       WHERE translations ? 'ar' OR translations ? 'he';
    `);
    await queryRunner.query(`
      UPDATE content_blocks
         SET payload = jsonb_set(
              payload,
              '{translations}',
              COALESCE(payload->'translations', '{}'::jsonb) - 'ar' - 'he'
            )
       WHERE payload->'translations' ? 'ar' OR payload->'translations' ? 'he';
    `);
  }
}
