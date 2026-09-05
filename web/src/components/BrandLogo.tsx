type BrandLogoProps = {
  variant: 'compact' | 'full';
};

export function BrandLogo({ variant }: BrandLogoProps) {
  if (variant === 'full') {
    return (
      <img
        src="/logo.png"
        alt="PeoplePay360 HR and Payroll"
        className="brand-logo brand-logo--full"
      />
    );
  }

  return (
    <span className="brand-logo brand-logo--compact">
      <img src="/favicon.png" alt="" className="brand-logo__mark" aria-hidden="true" />
      <span>PeoplePay360</span>
    </span>
  );
}
