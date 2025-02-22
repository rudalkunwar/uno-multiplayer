import type { AppProps } from 'next/app'
import '../globals.css'
import { GameProvider } from '../context/GameContext'

function MyApp({ Component, pageProps }: AppProps) {
    return (
        <GameProvider>
            <Component {...pageProps} />
        </GameProvider>
    )
}

export default MyApp