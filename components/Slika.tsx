/**
 * Sve slike u aplikaciji idu kroz ovu komponentu.
 *
 * U V1 renderuje običnu <img> oznaku — bez next/image, bez lazy loadinga,
 * bez responsive veličina.
 *
 * [V2] kandidat za next/image — mijenja se isključivo ova komponenta,
 *      nijedno pozivno mjesto.
 */
type Props = {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
};

export default function Slika({ src, alt, width, height, className }: Props) {
  // eslint-disable-next-line @next/next/no-img-element
  return (
    <img src={src} alt={alt} width={width} height={height} className={className} />
  );
}
