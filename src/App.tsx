import { useDeferredValue, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import CssBaseline from '@mui/material/CssBaseline'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import { createTheme, ThemeProvider } from '@mui/material/styles'
import './App.css'
import Appbar from './components/Appbar'
import Input from './components/Input'
import ResumeCanvas from './components/ResumeCanvas'
import { siteConfig } from './config/site'
import { DEFAULT_DETAIL_KEYS, DETAIL_LIMIT, isDetailKey } from './details'
import { serializeResumeData } from './resumeJson'
import { initialResumeData, type CacheStatus, type ResumeData } from './types'
import { getThemeColor, getThemeContrastColor, THEME_LIGHTNESS, THEME_SATURATION } from './theme'

const STORAGE_KEY = 'compass-resume-v2'
const SITE_THEME_STORAGE_KEY = 'compass-site-theme'
type SiteTheme = 'dark' | 'light'
type StoredResumeData = Partial<ResumeData> & { rank?: string; enjoyRank?: string; iconCount?: string }

const getInitialSiteTheme = (): SiteTheme =>
  document.documentElement.dataset.theme === 'light' ? 'light' : 'dark'

function getInitialData(): ResumeData {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return initialResumeData
    const parsed = JSON.parse(stored) as StoredResumeData
    const highestRank = parsed.highestRank ?? parsed.rank ?? initialResumeData.highestRank
    const seasonHighestRank = parsed.seasonHighestRank ?? initialResumeData.seasonHighestRank
    const goldIconCount = parsed.goldIconCount ?? parsed.iconCount ?? initialResumeData.goldIconCount
    const selectedDetailKeys = Array.isArray(parsed.selectedDetailKeys)
      ? parsed.selectedDetailKeys.filter(isDetailKey).slice(0, DETAIL_LIMIT)
      : DEFAULT_DETAIL_KEYS
    const heroSelections = Array.isArray(parsed.heroSelections)
      ? [...new Set(
        parsed.heroSelections
          .filter((name): name is string => typeof name === 'string' && Boolean(name.trim()))
          .map((name) => name.trim()),
      )].slice(0, 6)
      : initialResumeData.heroSelections
    delete parsed.rank
    delete parsed.enjoyRank
    delete parsed.iconCount
    return {
      ...initialResumeData,
      ...parsed,
      highestRank,
      seasonHighestRank,
      goldIconCount,
      selectedDetailKeys,
      heroSelections: heroSelections.length > 0 ? heroSelections : [initialResumeData.heroSelections[0]],
    }
  } catch {
    return initialResumeData
  }
}

function App() {
  const [resume, setResume] = useState<ResumeData>(getInitialData)
  const [siteTheme, setSiteTheme] = useState<SiteTheme>(getInitialSiteTheme)
  const deferredResume = useDeferredValue(resume)
  const [cacheStatus, setCacheStatus] = useState<CacheStatus>('saved')
  const [resetDialogOpen, setResetDialogOpen] = useState(false)
  const resetCancelButtonRef = useRef<HTMLButtonElement>(null)
  const muiTheme = useMemo(() => createTheme({
    palette: {
      mode: siteTheme,
      primary: {
        main: getThemeColor(initialResumeData.themeHue),
        contrastText: getThemeContrastColor(initialResumeData.themeHue),
      },
      background: siteTheme === 'dark'
        ? { default: '#0c0d0f', paper: '#151619' }
        : { default: '#eeece6', paper: '#fffdf8' },
      text: siteTheme === 'dark'
        ? { primary: '#f3efe7', secondary: '#aaa39a' }
        : { primary: '#202126', secondary: '#625e58' },
    },
    typography: {
      fontFamily: '"Noto Sans JP", sans-serif',
    },
  }), [siteTheme])

  const themeStyle = {
    '--accent-hue': resume.themeHue,
    '--accent-saturation': `${THEME_SATURATION}%`,
    '--accent-lightness': `${THEME_LIGHTNESS}%`,
    '--accent-contrast': getThemeContrastColor(resume.themeHue),
    '--red': getThemeColor(resume.themeHue),
  } as CSSProperties

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(resume))
      setCacheStatus('saved')
    } catch {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...resume, avatarDataUrl: '' }))
        setCacheStatus('without-image')
      } catch {
        setCacheStatus('error')
      }
    }
  }, [resume])

  useEffect(() => {
    document.documentElement.dataset.theme = siteTheme
    document.documentElement.style.colorScheme = siteTheme
    document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')?.setAttribute(
      'content',
      siteTheme === 'dark' ? '#0c0d0f' : '#eeece6',
    )
    try {
      localStorage.setItem(SITE_THEME_STORAGE_KEY, siteTheme)
    } catch {
      // The selected theme still applies for the current session.
    }
  }, [siteTheme])

  const reset = () => setResetDialogOpen(true)

  const confirmReset = () => {
    setResume(initialResumeData)
    setResetDialogOpen(false)
  }

  const saveJson = () => {
    const blob = new Blob([serializeResumeData(resume)], { type: 'application/json;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    const safeName = resume.playerName.trim().replace(/[\\/:*?"<>|]/g, '_') || 'compass-resume'
    const date = new Date().toISOString().slice(0, 10).replaceAll('-', '')
    link.href = url
    link.download = `${safeName}-履歴書-${date}.json`
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 0)
  }

  return (
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />
      <div className="app-shell" style={themeStyle}>
        <Appbar theme={siteTheme} onToggleTheme={() => setSiteTheme((current) => current === 'dark' ? 'light' : 'dark')} />
        <main>
          <section className="hero-intro">
            <div className="hero-copy">
              <span className="hero-kicker"><i /> PLAYER CARD GENERATOR</span>
              <h1><span>#コンパス履歴書</span><br />ジェネレーター</h1>
              <p>
                画像加工アプリ不要で、#コンパス履歴書の作成が完了します。
              </p>
            </div>
          </section>

          <div className="workspace">
            <Input value={resume} onChange={setResume} onReset={reset} onSaveJson={saveJson} cacheStatus={cacheStatus} />
            <div className="preview-column">
              <ResumeCanvas data={deferredResume} />
            </div>
          </div>
        </main>
        <footer>
          <div className="footer-brand">
            <strong>#コンパス履歴書ジェネレーター</strong>
            <a href={siteConfig.parentSiteUrl} target="_blank" rel="noreferrer" aria-label="aosankaku.netを新しいタブで開く">
              aosankaku.net
            </a>
            <a href={siteConfig.craftersSiteUrl} target="_blank" rel="noreferrer" aria-label="くらふとすきーを新しいタブで開く">
              くらふとすきー
            </a>
          </div>
          <span>入力した情報・画像はサーバーへ送信されません。</span>
        </footer>
        <Dialog
          className="reset-dialog"
          open={resetDialogOpen}
          onClose={() => setResetDialogOpen(false)}
          TransitionProps={{ onEntered: () => resetCancelButtonRef.current?.focus() }}
          aria-labelledby="reset-dialog-title"
          aria-describedby="reset-dialog-description"
        >
          <DialogTitle id="reset-dialog-title">入力内容を初期値に戻しますか？</DialogTitle>
          <DialogContent>
            <p id="reset-dialog-description">入力したプロフィール、選択項目、画像、テーマカラーが初期状態に戻ります。</p>
          </DialogContent>
          <DialogActions>
            <button ref={resetCancelButtonRef} className="dialog-button secondary" type="button" onClick={() => setResetDialogOpen(false)}>
              キャンセル
            </button>
            <button className="dialog-button danger" type="button" onClick={confirmReset}>
              初期値に戻す
            </button>
          </DialogActions>
        </Dialog>
      </div>
    </ThemeProvider>
  )
}

export default App
