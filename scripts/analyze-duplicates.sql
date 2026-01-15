-- Analyser les ressources dupliquées
-- Requête 1 : Compter les doublons
SELECT 
  COUNT(*) as total_resources,
  COUNT(DISTINCT LOWER(title)) as unique_titles,
  COUNT(*) - COUNT(DISTINCT LOWER(title)) as total_duplicates
FROM resources;

-- Requête 2 : Lister les groupes de doublons (top 20)
SELECT 
  LOWER(title) as title_lower,
  COUNT(*) as count,
  GROUP_CONCAT(id ORDER BY id) as ids,
  GROUP_CONCAT(CHAR_LENGTH(summary) ORDER BY id) as summary_lengths
FROM resources
GROUP BY LOWER(title)
HAVING count > 1
ORDER BY count DESC
LIMIT 20;

-- Requête 3 : Identifier les ressources à supprimer (garder la plus complète)
SELECT 
  LOWER(r1.title) as title_lower,
  r1.id as id_to_keep,
  GROUP_CONCAT(r2.id ORDER BY r2.id) as ids_to_delete,
  COUNT(r2.id) as duplicates_count
FROM resources r1
INNER JOIN resources r2 ON LOWER(r1.title) = LOWER(r2.title) AND r1.id < r2.id
GROUP BY LOWER(r1.title), r1.id
HAVING COUNT(r2.id) > 0
ORDER BY COUNT(r2.id) DESC
LIMIT 20;
