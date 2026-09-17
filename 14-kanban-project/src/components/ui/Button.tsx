import type { ComponentPropsWithRef } from 'react';

type Variant = 'primary' | 'ghost';

type Props = ComponentPropsWithRef<'button'> & { variant?: Variant };

export default function Button({ variant = 'primary', className, ...rest }: Props) {
  const cls = `btn btn--${variant}${className ? ` ${className}` : ''}`;
  return <button className={cls} {...rest} />;
}