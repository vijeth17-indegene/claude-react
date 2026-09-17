import type { ComponentPropsWithRef } from 'react';

type Props = ComponentPropsWithRef<'div'>;

export default function Card({ className, ...rest }: Props) {
  const cls = `card${className ? ` ${className}` : ''}`;
  return <div className={cls} {...rest} />;
}