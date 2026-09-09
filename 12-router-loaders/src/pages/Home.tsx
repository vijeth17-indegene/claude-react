import ErrorBoundary from "../components/ErrorBoundary";
import BuggyWidget from '../components/BuggyWidget';

export default function Home() {
    return(
        <>
            <h1>Home</h1>
            <ErrorBoundary fallback={<p>Widget Crashed</p>}>
                <BuggyWidget />            
            </ErrorBoundary>
        </>
    );
}