#!/bin/bash
cd /home/ubuntu/ressourcerie-ifac

# Créer le fichier de remplacement
cat > /tmp/import-fix.txt << 'REPLACE'
    importPDFBulk: adminProcedure
      .input(z.object({
        resources: z.array(z.object({
          title: z.string(),
          summary: z.string(),
          content: z.string(),
          type: z.string(),
          visibility: z.string(),
          accessLevel: z.string(),
          status: z.string(),
          profiles: z.array(z.string()),
          fileUrl: z.string(),
          fileName: z.string(),
          folder: z.string(),
        }))
      }))
      .mutation(async ({ input }) => {
        const results = [];
        let imported = 0;
        let failed = 0;
        const errors: string[] = [];

        for (const resource of input.resources) {
          try {
            const resourceId = await db.createResource({
              title: resource.title,
              summary: resource.summary,
              content: resource.content,
              type: resource.type,
              visibility: resource.visibility,
              accessLevel: resource.accessLevel,
              status: resource.status,
              fileUrl: null,
              thumbnailUrl: null,
              category: JSON.stringify([resource.folder]),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }, []);

            for (const profile of resource.profiles) {
              await db.addResourceProfile(resourceId, profile);
            }

            results.push({
              fileName: resource.fileName,
              status: 'success',
              resourceId,
              title: resource.title,
            });
            imported++;
          } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Erreur inconnue';
            errors.push(`${resource.fileName}: ${errorMsg}`);
            results.push({
              fileName: resource.fileName,
              status: 'error',
              error: errorMsg,
            });
            failed++;
          }
        }

        return {
          total: input.resources.length,
          imported,
          failed,
          errors,
          results,
        };
      }),
REPLACE

# Utiliser sed pour remplacer
sed -i '/importPDFBulk: adminProcedure/,/^      }),$/c\    importPDFBulk: adminProcedure\n      .input(z.object({\n        resources: z.array(z.object({\n          title: z.string(),\n          summary: z.string(),\n          content: z.string(),\n          type: z.string(),\n          visibility: z.string(),\n          accessLevel: z.string(),\n          status: z.string(),\n          profiles: z.array(z.string()),\n          fileUrl: z.string(),\n          fileName: z.string(),\n          folder: z.string(),\n        }))\n      }))\n      .mutation(async ({ input }) => {\n        const results = [];\n        let imported = 0;\n        let failed = 0;\n        const errors: string[] = [];\n\n        for (const resource of input.resources) {\n          try {\n            const resourceId = await db.createResource({\n              title: resource.title,\n              summary: resource.summary,\n              content: resource.content,\n              type: resource.type,\n              visibility: resource.visibility,\n              accessLevel: resource.accessLevel,\n              status: resource.status,\n              fileUrl: null,\n              thumbnailUrl: null,\n              category: JSON.stringify([resource.folder]),\n              createdAt: new Date().toISOString(),\n              updatedAt: new Date().toISOString(),\n            }, []);\n\n            for (const profile of resource.profiles) {\n              await db.addResourceProfile(resourceId, profile);\n            }\n\n            results.push({\n              fileName: resource.fileName,\n              status: '"'"'success'"'"',\n              resourceId,\n              title: resource.title,\n            });\n            imported++;\n          } catch (error) {\n            const errorMsg = error instanceof Error ? error.message : '"'"'Erreur inconnue'"'"';\n            errors.push(`${resource.fileName}: ${errorMsg}`);\n            results.push({\n              fileName: resource.fileName,\n              status: '"'"'error'"'"',\n              error: errorMsg,\n            });\n            failed++;\n          }\n        }\n\n        return {\n          total: input.resources.length,\n          imported,\n          failed,\n          errors,\n          results,\n        };\n      }),' server/routers.ts

echo "✅ Fichier corrigé"
