/** Serializes JSON-LD safely: escaping `<` prevents a CMS value like `</script>` from breaking out of the tag. */
export default function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
