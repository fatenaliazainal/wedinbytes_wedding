/**
 * AdminEditorPage — admin-only invitation editor.
 *
 * Renders the same editor as buyers/businesses but with all colour, font, and
 * size controls hidden.  Those are managed globally via Card Design settings.
 *
 * Routing: /admin/demo  →  this page
 * Buyer / business routing still uses EditorPage directly.
 */
import EditorPage from "@/pages/EditorPage";

export default function AdminEditorPage() {
  return <EditorPage mode="demo" />;
}
