import { useState, type MouseEvent } from 'react'
import HomeRoundedIcon from '@mui/icons-material/HomeRounded'
import ShareRoundedIcon from '@mui/icons-material/ShareRounded'
import CheckRoundedIcon from '@mui/icons-material/CheckRounded'
import DarkModeRoundedIcon from '@mui/icons-material/DarkModeRounded'
import LightModeRoundedIcon from '@mui/icons-material/LightModeRounded'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import { FaDiscord, FaLine, FaXTwitter } from 'react-icons/fa6'
import { siteConfig } from '../config/site'
import {
  DISCORD_MESSAGES_URL,
  getSiteLineShareUrl,
  getSiteXShareUrl,
  SITE_SHARE_CLIPBOARD_TEXT,
} from '../siteShare'

type SiteTheme = 'dark' | 'light'

type Props = {
  theme: SiteTheme
  onToggleTheme: () => void
}

function Appbar({ theme, onToggleTheme }: Props) {
  const [shareMenuAnchor, setShareMenuAnchor] = useState<HTMLElement | null>(null)
  const [discordCopyStatus, setDiscordCopyStatus] = useState<'idle' | 'copied' | 'error'>('idle')
  const shareMenuOpen = shareMenuAnchor !== null

  const openShareMenu = (event: MouseEvent<HTMLButtonElement>) => {
    setShareMenuAnchor(event.currentTarget)
  }

  const closeShareMenu = () => setShareMenuAnchor(null)

  const copySiteShareForDiscord = async () => {
    closeShareMenu()
    try {
      await navigator.clipboard.writeText(SITE_SHARE_CLIPBOARD_TEXT)
      setDiscordCopyStatus('copied')
      window.setTimeout(() => setDiscordCopyStatus('idle'), 2600)
    } catch {
      setDiscordCopyStatus('error')
      window.setTimeout(() => setDiscordCopyStatus('idle'), 3600)
    }
  }

  return (
    <header className="appbar" id="top">
      <a className="brand" href="/" aria-label="ページの先頭へ">
        <span className="brand-mark">#</span>
        <span>コンパス履歴書</span>
        <small>GENERATOR V2</small>
      </a>
      <nav aria-label="サイトメニュー">
        <button
          className="site-theme-toggle"
          type="button"
          aria-label={`${theme === 'dark' ? 'ライト' : 'ダーク'}テーマに切り替える`}
          title={`${theme === 'dark' ? 'ライト' : 'ダーク'}テーマに切り替える`}
          onClick={onToggleTheme}
        >
          {theme === 'dark' ? <LightModeRoundedIcon /> : <DarkModeRoundedIcon />}
          <span>{theme === 'dark' ? 'ライト' : 'ダーク'}</span>
        </button>
        <a href={siteConfig.parentSiteUrl} target="_blank" rel="noreferrer" aria-label="ホームサイトを開く">
          <HomeRoundedIcon />
        </a>
        <button
          id="site-share-button"
          type="button"
          onClick={openShareMenu}
          aria-label="このサイトを共有"
          aria-controls={shareMenuOpen ? 'site-share-menu' : undefined}
          aria-haspopup="menu"
          aria-expanded={shareMenuOpen ? 'true' : undefined}
        >
          {discordCopyStatus === 'copied' ? <CheckRoundedIcon /> : <ShareRoundedIcon />}
          <span>{discordCopyStatus === 'copied' ? 'コピー済み' : 'サイト共有'}</span>
        </button>
        <Menu
          className="site-share-menu"
          id="site-share-menu"
          anchorEl={shareMenuAnchor}
          open={shareMenuOpen}
          onClose={closeShareMenu}
          MenuListProps={{ 'aria-labelledby': 'site-share-button' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        >
          <MenuItem component="a" href={getSiteXShareUrl()} target="_blank" rel="noopener noreferrer" onClick={closeShareMenu}>
            <ListItemIcon className="site-share-icon site-share-icon-x"><FaXTwitter aria-hidden="true" /></ListItemIcon>
            <ListItemText primary="X（Twitter）" secondary="サイト紹介文をポスト" />
          </MenuItem>
          <MenuItem
            component="a"
            href={DISCORD_MESSAGES_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => void copySiteShareForDiscord()}
          >
            <ListItemIcon className="site-share-icon site-share-icon-discord"><FaDiscord aria-hidden="true" /></ListItemIcon>
            <ListItemText primary="Discord" secondary="紹介文をコピーしてDiscordを開く" />
          </MenuItem>
          <MenuItem component="a" href={getSiteLineShareUrl()} target="_blank" rel="noopener noreferrer" onClick={closeShareMenu}>
            <ListItemIcon className="site-share-icon site-share-icon-line"><FaLine aria-hidden="true" /></ListItemIcon>
            <ListItemText primary="LINE" secondary="友だちやグループへ送る" />
          </MenuItem>
        </Menu>
        <span className="sr-only" role={discordCopyStatus === 'error' ? 'alert' : 'status'} aria-live="polite">
          {discordCopyStatus === 'copied'
            ? 'サイトの紹介文とURLをコピーしました。Discordで貼り付けてください。'
            : discordCopyStatus === 'error'
              ? 'サイトの紹介文をコピーできませんでした。'
              : ''}
        </span>
      </nav>
    </header>
  )
}

export default Appbar
