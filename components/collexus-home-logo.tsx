type CollexusHomeLogoProps = {
  basePath: string;
  wordmarkClassName?: string;
};

export function CollexusHomeLogo({ basePath, wordmarkClassName }: CollexusHomeLogoProps) {
  return (
    <>
      <span className="college-logo-wrap" aria-hidden="true">
        <img src={`${basePath}/collexus-logo.svg`} alt="" className="college-logo" />
      </span>
      <span className={['collexus-word', wordmarkClassName].filter(Boolean).join(' ')} aria-hidden="true">llexus</span>
    </>
  );
}
