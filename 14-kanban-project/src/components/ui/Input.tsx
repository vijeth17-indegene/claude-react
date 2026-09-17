import type { ComponentPropsWithRef } from 'react';

type Props = ComponentPropsWithRef<'input'>;

export default function Input({ className, ...rest }: Props) {
  const cls = `input${className ? ` ${className}` : ''}`;
  return <input className={cls} {...rest} />;
}