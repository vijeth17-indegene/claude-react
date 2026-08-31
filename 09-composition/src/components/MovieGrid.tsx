import type { ReactNode } from 'react';

type MovieGridProps = {
    children: ReactNode;
}

export default function MovieGrid({ children }: MovieGridProps) {
    return (
        <div className='movie-grid'>
            {children}
        </div>
    );
}