import { Component, type ReactNode, type ErrorInfo } from 'react';

type Props = { children: ReactNode; fallback: ReactNode };
type State = { hasError: boolean };

export default class ErrorBoundary extends Component<Props, State> {
    state: State = { hasError: false };

    static getDerivedStateFromError(): State {
        return { hasError: true };
    }

    componentDidCatch(error: Error, info: ErrorInfo) {
        console.error('ErrorBoundary caught:', error, info);
    }

    render() {
        if (this.state.hasError) return this.props.fallback;
        return this.props.children;
    }
}