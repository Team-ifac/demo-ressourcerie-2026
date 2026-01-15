import { router, protectedProcedure, adminProcedure } from "./_core/trpc";
import { z } from "zod";
import {
  getCMSPage,
  saveCMSPage,
  updateSection,
  deleteSection,
  reorderSections,
  createEmptyPage,
  type CMSPage,
  type CMSSection,
} from "./cmsService";

export const cmsRouter = router({
  /**
   * Récupère une page CMS
   */
  getPage: protectedProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }: any) => {
      const page = await getCMSPage(input.slug);
      return page;
    }),

  /**
   * Sauvegarde une page CMS (admin only)
   */
  savePage: adminProcedure
    .input(
      z.object({
        slug: z.string(),
        title: z.string(),
        description: z.string().optional(),
        sections: z.array(
          z.object({
            id: z.string(),
            name: z.string(),
            type: z.enum(["hero", "text", "image", "cta", "features", "testimonials", "parcours"]),
            order: z.number(),
            content: z.record(z.string(), z.any()),
          })
        ),
      })
    )
    .mutation(async ({ input }: any) => {
      const page: CMSPage = {
        slug: input.slug,
        title: input.title,
        description: input.description || "",
        sections: input.sections,
      };

      const success = await saveCMSPage(page);
      return { success };
    }),

  /**
   * Met à jour une section (admin only)
   */
  updateSection: adminProcedure
    .input(
      z.object({
        pageSlug: z.string(),
        section: z.object({
          id: z.string(),
          name: z.string(),
          type: z.enum(["hero", "text", "image", "cta", "features", "testimonials", "parcours"]),
          order: z.number(),
          content: z.record(z.string(), z.any()),
        }),
      })
    )
    .mutation(async ({ input }: any) => {
      const page = await getCMSPage(input.pageSlug);
      if (!page) {
        throw new Error("Page not found");
      }

      const updatedPage = updateSection(page, input.section);
      const success = await saveCMSPage(updatedPage);

      return { success, page: updatedPage };
    }),

  /**
   * Supprime une section (admin only)
   */
  deleteSection: adminProcedure
    .input(
      z.object({
        pageSlug: z.string(),
        sectionId: z.string(),
      })
    )
    .mutation(async ({ input }: any) => {
      const page = await getCMSPage(input.pageSlug);
      if (!page) {
        throw new Error("Page not found");
      }

      const updatedPage = deleteSection(page, input.sectionId);
      const success = await saveCMSPage(updatedPage);

      return { success, page: updatedPage };
    }),

  /**
   * Réorganise les sections (admin only)
   */
  reorderSections: adminProcedure
    .input(
      z.object({
        pageSlug: z.string(),
        sectionIds: z.array(z.string()),
      })
    )
    .mutation(async ({ input }: any) => {
      const page = await getCMSPage(input.pageSlug);
      if (!page) {
        throw new Error("Page not found");
      }

      const updatedPage = reorderSections(page, input.sectionIds);
      const success = await saveCMSPage(updatedPage);

      return { success, page: updatedPage };
    }),

  /**
   * Crée une nouvelle page CMS (admin only)
   */
  createPage: adminProcedure
    .input(
      z.object({
        slug: z.string(),
        title: z.string(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ input }: any) => {
      const page: CMSPage = createEmptyPage(input.slug, input.title);
      if (input.description) {
        page.description = input.description;
      }

      const success = await saveCMSPage(page);
      return { success, page };
    }),
});
