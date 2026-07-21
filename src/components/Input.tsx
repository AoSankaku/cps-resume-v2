import { useEffect, useMemo, useRef, useState, type ChangeEvent, type CSSProperties } from 'react'
import AddPhotoAlternateRoundedIcon from '@mui/icons-material/AddPhotoAlternateRounded'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'
import FileUploadRoundedIcon from '@mui/icons-material/FileUploadRounded'
import LocalFireDepartmentRoundedIcon from '@mui/icons-material/LocalFireDepartmentRounded'
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded'
import RestartAltRoundedIcon from '@mui/icons-material/RestartAltRounded'
import RestoreRoundedIcon from '@mui/icons-material/RestoreRounded'
import SaveAltRoundedIcon from '@mui/icons-material/SaveAltRounded'
import StorageRoundedIcon from '@mui/icons-material/StorageRounded'
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded'
import { hero, ranks } from '../data/main'
import { countDetailSlots, detailOptions, DETAIL_LIMIT, getDetailSlots, type DetailKey } from '../details'
import {
  detectAnimatedImageFormat,
  getAnimatedImageFormatFromDataUrl,
  MAX_ANIMATED_IMAGE_SOURCE_BYTES,
  type AnimatedImageFormat,
} from '../gifFrames'
import { COMMENT_MAX_LENGTH, normalizeComment } from '../resumeData'
import { getResumeParseErrorMessage, parseResumeText, serializeResumeData } from '../resumeJson'
import { getThemeColor, getThemeContrastColor } from '../theme'
import type { AvatarFit, AvatarFrame, CacheStatus, ResumeData, Role } from '../types'

type Props = {
  value: ResumeData
  onChange: (next: ResumeData) => void
  onReset: () => void
  onSaveBackupFile: () => void
  onShowStorageWarning: () => void
  cacheStatus: CacheStatus
}

const roles: { key: Role; label: string }[] = [
  { key: 'attacker', label: 'アタッカー' },
  { key: 'gunner', label: 'ガンナー' },
  { key: 'tank', label: 'タンク' },
  { key: 'sprinter', label: 'スプリンター' },
]

const avatarFrameOptions: Array<{ value: AvatarFrame; label: string; description: string; recommended?: boolean }> = [
  {
    value: 'square',
    label: '1:1（正方形）',
    description: '一般的なプロフィール画像向け。右寄せで表示します。',
    recommended: true,
  },
  {
    value: 'landscape',
    label: '横長',
    description: 'これまでと同じ横長の枠で表示します。',
  },
]

const avatarFitOptions: Array<{ value: AvatarFit; label: string; description: string; recommended?: boolean }> = [
  {
    value: 'contain',
    label: '画像をすべて見せる',
    description: '画像全体が収まるように表示します。正方形のアイコンにおすすめです。',
    recommended: true,
  },
  {
    value: 'cover',
    label: '枠いっぱいに広げる',
    description: '枠をすき間なく埋め、はみ出す部分を切り取ります。',
  },
]

const themePresets = [
  { hue: 350, label: 'レッド' },
  { hue: 28, label: 'オレンジ' },
  { hue: 55, label: 'イエロー' },
  { hue: 130, label: 'グリーン' },
  { hue: 185, label: 'シアン' },
  { hue: 220, label: 'ブルー' },
  { hue: 270, label: 'パープル' },
  { hue: 315, label: 'ピンク' },
]

const seriousLevelLabels = ['エンジョイ', 'ゆるめ', 'ほどほど', 'しっかり', 'ガチ'] as const
const MAX_DECK_LEVEL = 240
const APPLICATION_CODE_PATTERN = /^[A-Za-z]-[A-Za-z]{4}$/
const APPLICATION_CODE_WARNING_ID = 'application-code-warning'
const FRIEND_CODE_PATTERN = /^[0-9]{10}$/
const FRIEND_CODE_WARNING_ID = 'friend-code-warning'
const ICON_COUNT_HINT_ID = 'icon-count-hint'
const BACKUP_TEXT_HINT_ID = 'backup-text-hint'
const BACKUP_FEEDBACK_ID = 'backup-feedback'
const AVATAR_FEEDBACK_ID = 'avatar-feedback'
const MAX_BACKUP_FILE_SIZE = 25 * 1024 * 1024

type BackupFeedback = {
  tone: 'success' | 'warning' | 'error'
  message: string
}

const sanitizeIconCount = (next: string) => {
  const normalized = next.replace(/[~〜]/g, '～').replace(/\+/g, '＋')
  const digits = normalized.replace(/[^0-9]/g, '').slice(0, 4)
  if (normalized.includes('～') && digits) return `${digits}～`
  if (normalized.includes('＋') && digits) return `${digits}＋`
  if (normalized.includes('↑') && digits) return `${digits}↑`
  return digits
}

type ThemeColorControlProps = {
  hue: number
  onCommit: (hue: number) => void
}

function ThemeColorControl({ hue, onCommit }: ThemeColorControlProps) {
  const [draftHue, setDraftHue] = useState(hue)
  const pendingHueRef = useRef(hue)
  const commitTimerRef = useRef<number | null>(null)

  useEffect(() => {
    pendingHueRef.current = hue
    setDraftHue(hue)
  }, [hue])
  useEffect(() => () => {
    if (commitTimerRef.current !== null) window.clearTimeout(commitTimerRef.current)
  }, [])

  const previewTheme = (source: HTMLElement, nextHue: number) => {
    const shell = source.closest<HTMLElement>('.app-shell')
    if (!shell) return
    shell.style.setProperty('--accent-hue', String(nextHue))
    shell.style.setProperty('--red', getThemeColor(nextHue))
    shell.style.setProperty('--accent-contrast', getThemeContrastColor(nextHue))
  }

  const commitNow = (nextHue: number) => {
    if (commitTimerRef.current !== null) window.clearTimeout(commitTimerRef.current)
    commitTimerRef.current = null
    onCommit(nextHue)
  }

  const scheduleCommit = (nextHue: number) => {
    if (commitTimerRef.current !== null) window.clearTimeout(commitTimerRef.current)
    commitTimerRef.current = window.setTimeout(() => commitNow(nextHue), 120)
  }

  const handleSliderChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextHue = Number(event.target.value)
    pendingHueRef.current = nextHue
    setDraftHue(nextHue)
    previewTheme(event.currentTarget, nextHue)
    scheduleCommit(nextHue)
  }

  return (
    <section className="form-section theme-section">
      <div className="theme-heading">
        <div>
          <h3><span>05</span> テーマカラー</h3>
        </div>
        <output className="theme-value" aria-live="polite">
          <i aria-hidden="true" /> 色相 {draftHue}°
        </output>
      </div>
      <label className="theme-slider-label">
        <span className="sr-only">テーマカラーの色相</span>
        <input
          className="theme-slider"
          type="range"
          min="0"
          max="359"
          step="1"
          value={draftHue}
          aria-describedby="theme-color-hint"
          aria-valuetext={`色相 ${draftHue}度、明るさ60パーセント固定`}
          onChange={handleSliderChange}
          onPointerUp={() => commitNow(pendingHueRef.current)}
          onKeyUp={() => commitNow(pendingHueRef.current)}
          onBlur={() => commitNow(pendingHueRef.current)}
        />
      </label>
      <div className="theme-presets" role="group" aria-label="おすすめのテーマカラー">
        {themePresets.map(({ hue: presetHue, label }) => (
          <button
            key={presetHue}
            type="button"
            className={draftHue === presetHue ? 'selected' : ''}
            style={{ '--swatch-hue': presetHue } as CSSProperties}
            aria-label={label}
            aria-pressed={draftHue === presetHue}
            onClick={(event) => {
              pendingHueRef.current = presetHue
              setDraftHue(presetHue)
              previewTheme(event.currentTarget, presetHue)
              commitNow(presetHue)
            }}
          />
        ))}
      </div>
    </section>
  )
}

function Input({ value, onChange, onReset, onSaveBackupFile, onShowStorageWarning, cacheStatus }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const backupFileRef = useRef<HTMLInputElement>(null)
  const [backupText, setBackupText] = useState(() => serializeResumeData(value))
  const [backupTextDirty, setBackupTextDirty] = useState(false)
  const [backupFeedback, setBackupFeedback] = useState<BackupFeedback | null>(null)
  const [avatarFeedback, setAvatarFeedback] = useState<BackupFeedback | null>(null)
  const seasonHighestRankIndex = ranks.indexOf(value.seasonHighestRank)
  const heroOptions = useMemo(
    () => roles.flatMap(({ key, label }) => hero[key].map((item) => ({ ...item, role: key, roleLabel: label }))),
    [],
  )

  useEffect(() => {
    if (!backupTextDirty) setBackupText(serializeResumeData(value))
  }, [backupTextDirty, value])

  const update = <K extends keyof ResumeData>(key: K, next: ResumeData[K]) => {
    onChange({ ...value, [key]: next })
  }

  const updateSeasonHighestRank = (next: string) => {
    const nextRankIndex = ranks.indexOf(next)
    const highestRankIndex = ranks.indexOf(value.highestRank)
    onChange({
      ...value,
      seasonHighestRank: next,
      highestRank: nextRankIndex > highestRankIndex ? next : value.highestRank,
    })
  }

  const updateMaxDeckLevel = (next: string) => {
    const numericValue = next.replace(/\D/g, '')
    if (numericValue && Number(numericValue) > MAX_DECK_LEVEL) return
    update('maxDeckLevel', numericValue)
  }

  const updateHero = (index: number, next: string) => {
    if (value.heroSelections.some((selection, itemIndex) => itemIndex !== index && selection === next)) return
    const selections = [...value.heroSelections]
    const previousHero = selections[index]
    selections[index] = next
    onChange({
      ...value,
      heroSelections: selections,
      practicingHeroes: value.practicingHeroes.filter((name) => name !== previousHero),
    })
  }

  const addHero = () => {
    if (value.heroSelections.length >= 6) return
    const nextHero = heroOptions.find(({ fullName }) => !value.heroSelections.includes(fullName))?.fullName
      ?? heroOptions[0]?.fullName
      ?? ''
    update('heroSelections', [...value.heroSelections, nextHero])
  }

  const removeHero = (index: number) => {
    if (value.heroSelections.length <= 1) return
    const removedHero = value.heroSelections[index]
    onChange({
      ...value,
      heroSelections: value.heroSelections.filter((_, itemIndex) => itemIndex !== index),
      practicingHeroes: value.practicingHeroes.filter((name) => name !== removedHero),
    })
  }

  const toggleHeroPractice = (heroName: string) => {
    const isPracticing = value.practicingHeroes.includes(heroName)
    update(
      'practicingHeroes',
      isPracticing
        ? value.practicingHeroes.filter((name) => name !== heroName)
        : [...value.practicingHeroes, heroName],
    )
  }

  const selectedDetailSlots = countDetailSlots(value.selectedDetailKeys)

  const toggleDetail = (key: DetailKey) => {
    const selected = value.selectedDetailKeys.includes(key)
    if (selected) {
      update('selectedDetailKeys', value.selectedDetailKeys.filter((item) => item !== key))
      return
    }
    if (selectedDetailSlots + getDetailSlots(key) > DETAIL_LIMIT) return
    update('selectedDetailKeys', [...value.selectedDetailKeys, key])
  }

  const isDetailEnabled = (key: DetailKey) => value.selectedDetailKeys.includes(key)
  const isApplicationCodeInvalid = isDetailEnabled('supportCode')
    && value.applicationCode.length > 0
    && !APPLICATION_CODE_PATTERN.test(value.applicationCode)
  const isFriendCodeInvalid = isDetailEnabled('friendCode')
    && value.friendCode.length > 0
    && !FRIEND_CODE_PATTERN.test(value.friendCode)

  const handleAvatar = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    const input = event.currentTarget
    let animationFormat: AnimatedImageFormat | null = null
    try {
      animationFormat = detectAnimatedImageFormat(new Uint8Array(await file.arrayBuffer()))
    } catch {
      setAvatarFeedback({ tone: 'error', message: '画像ファイルを読み取れませんでした。' })
      input.value = ''
      return
    }
    if (animationFormat && file.size > MAX_ANIMATED_IMAGE_SOURCE_BYTES) {
      setAvatarFeedback({ tone: 'error', message: 'アニメーション画像は15MB以下のファイルを選んでください。' })
      input.value = ''
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      update('avatarDataUrl', String(reader.result ?? ''))
      setAvatarFeedback({
        tone: 'success',
        message: animationFormat
          ? `${animationFormat === 'gif' ? 'アニメーションGIF' : animationFormat === 'apng' ? 'APNG' : 'アニメーションWebP'}を読み込みました。プレビューとGIF保存に反映されます。`
          : 'プレイヤーアイコン画像を読み込みました。',
      })
    }
    reader.onerror = () => setAvatarFeedback({ tone: 'error', message: '画像ファイルを読み取れませんでした。' })
    reader.readAsDataURL(file)
  }

  const applyBackupText = (text: string) => {
    const result = parseResumeText(text)
    if (!result.ok) {
      setBackupFeedback({ tone: 'error', message: getResumeParseErrorMessage(result.error) })
      return
    }
    onChange(result.data)
    setBackupText(serializeResumeData(result.data))
    setBackupTextDirty(false)
    setBackupFeedback({
      tone: result.corrected ? 'warning' : 'success',
      message: result.corrected
        ? '全角記号や末尾のカンマなどを補正して読み込みました。内容をご確認ください。'
        : 'バックアップを読み込みました。',
    })
  }

  const refreshBackupText = () => {
    setBackupText(serializeResumeData(value))
    setBackupTextDirty(false)
    setBackupFeedback({ tone: 'success', message: '現在の入力内容をバックアップ用テキストへ反映しました。' })
  }

  const handleBackupFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (file.size > MAX_BACKUP_FILE_SIZE) {
      setBackupFeedback({ tone: 'error', message: 'ファイルが大きすぎます。25MB以下のバックアップを選んでください。' })
      event.target.value = ''
      return
    }
    try {
      const text = await file.text()
      setBackupText(text)
      setBackupTextDirty(true)
      applyBackupText(text)
    } catch {
      setBackupFeedback({ tone: 'error', message: 'ファイルを読み取れませんでした。別のファイルをお試しください。' })
    } finally {
      event.target.value = ''
    }
  }

  return (
    <div className="editor-panel">
      <div className="editor-heading">
        <div>
          <span className="eyebrow">PLAYER DATA</span>
          <h2>プロフィールを入力</h2>
        </div>
        <div className="editor-heading-actions">
          <button className="text-button" type="button" onClick={onReset}>
            <RestartAltRoundedIcon fontSize="small" /> 初期値に戻す
          </button>
        </div>
      </div>

      <section className="form-section">
        <h3><span>01</span> 基本プロフィール</h3>
        <div className="field-grid">
          <label className="field field-wide">
            <span>プレイヤー名 <b>必須</b></span>
            <input value={value.playerName} maxLength={22} onChange={(e) => update('playerName', e.target.value)} />
          </label>
          <label className="field field-wide">
            <span>よみ・呼び方 <em>任意</em></span>
            <input value={value.pronunciation} maxLength={28} onChange={(e) => update('pronunciation', e.target.value)} />
          </label>
          <label className="field">
            <span>最高到達ランク <em>任意</em></span>
            <select name="highestRank" data-testid="highest-rank" value={value.highestRank} onChange={(e) => update('highestRank', e.target.value)}>
              <option value="">未記入</option>
              {ranks.map((rank, index) => (
                <option
                  key={rank}
                  disabled={seasonHighestRankIndex >= 0 && index < seasonHighestRankIndex}
                >
                  {rank}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>最高シーズン到達ランク <em>任意</em></span>
            <select
              name="seasonHighestRank"
              data-testid="season-highest-rank"
              value={value.seasonHighestRank}
              onChange={(e) => updateSeasonHighestRank(e.target.value)}
            >
              <option value="">未記入</option>
              {ranks.map((rank) => <option key={rank}>{rank}</option>)}
            </select>
          </label>
          <label className="field">
            <span>最高デッキレベル <em>最大{MAX_DECK_LEVEL}</em></span>
            <input
              inputMode="numeric"
              value={value.maxDeckLevel}
              maxLength={3}
              onChange={(e) => updateMaxDeckLevel(e.target.value)}
            />
          </label>
        </div>
      </section>

      <section className="form-section detail-picker-section" aria-labelledby="detail-picker-title">
        <div className="detail-picker-heading">
          <div>
            <h3 id="detail-picker-title"><span>02</span> 履歴書に乗せる追加情報</h3>
            <p id="detail-picker-hint">右下へ載せる項目を0〜6枠分選んでください。自由項目Lは横長で2枠使用します。</p>
          </div>
          <output className="detail-count" aria-live="polite">
            <strong>{selectedDetailSlots}</strong> / {DETAIL_LIMIT}
          </output>
        </div>
        <div className="detail-option-grid" role="group" aria-describedby="detail-picker-hint">
          {detailOptions.map(({ key, label, description, slots }) => {
            const selected = value.selectedDetailKeys.includes(key)
            const disabled = !selected && selectedDetailSlots + slots > DETAIL_LIMIT
            return (
              <label className={`detail-option${selected ? ' selected' : ''}${disabled ? ' disabled' : ''}`} key={key}>
                <input
                  type="checkbox"
                  data-testid={`detail-${key}`}
                  checked={selected}
                  disabled={disabled}
                  onChange={() => toggleDetail(key)}
                />
                <span className="detail-option-mark" aria-hidden="true">{selected ? '✓' : '+'}</span>
                <span className="detail-option-copy">
                  <strong>{label}{slots > 1 && <span className="detail-slot-badge">2枠</span>}</strong>
                  <small>{description}</small>
                </span>
              </label>
            )
          })}
        </div>
        <div className="detail-input-area" aria-labelledby="detail-input-title">
          <div className="detail-input-heading">
            <h4 id="detail-input-title">追加情報を入力</h4>
            <p>上で選択した項目だけ入力できます。未選択の項目も入力内容は保持されます。</p>
          </div>
          <div className="field-grid">
            <label className={`field${isDetailEnabled('supportCode') ? '' : ' field-disabled'}`}>
              <span>応援コード</span>
              <input
                disabled={!isDetailEnabled('supportCode')}
                value={value.applicationCode}
                maxLength={18}
                aria-invalid={isApplicationCodeInvalid}
                aria-describedby={isApplicationCodeInvalid ? APPLICATION_CODE_WARNING_ID : undefined}
                onChange={(event) => update('applicationCode', event.target.value)}
              />
              {isApplicationCodeInvalid && (
                <small id={APPLICATION_CODE_WARNING_ID} className="field-warning" role="alert">
                  英字1文字-英字4文字で入力してください（例：A-bCdE）。大文字・小文字はどちらも使えます。
                </small>
              )}
            </label>
            <label className={`field${isDetailEnabled('gender') ? '' : ' field-disabled'}`}>
              <span>性別</span>
              <input
                disabled={!isDetailEnabled('gender')}
                value={value.gender}
                maxLength={12}
                placeholder="例：男・女・♂・♀"
                onChange={(event) => update('gender', event.target.value)}
              />
            </label>
            <label className={`field${isDetailEnabled('accountLevel') ? '' : ' field-disabled'}`}>
              <span>アカウントレベル</span>
              <input disabled={!isDetailEnabled('accountLevel')} inputMode="numeric" value={value.accountLevel} maxLength={4} onChange={(event) => update('accountLevel', event.target.value.replace(/\D/g, ''))} />
            </label>
            <label className={`field${isDetailEnabled('friendCode') ? '' : ' field-disabled'}`}>
              <span>フレンドコード</span>
              <input
                disabled={!isDetailEnabled('friendCode')}
                inputMode="numeric"
                value={value.friendCode}
                maxLength={24}
                aria-invalid={isFriendCodeInvalid}
                aria-describedby={isFriendCodeInvalid ? FRIEND_CODE_WARNING_ID : undefined}
                onChange={(event) => update('friendCode', event.target.value)}
              />
              {isFriendCodeInvalid && (
                <small id={FRIEND_CODE_WARNING_ID} className="field-warning" role="alert">
                  半角数字10文字で入力してください（例：1234567890）。
                </small>
              )}
            </label>
            <label className={`field${isDetailEnabled('guild') ? '' : ' field-disabled'}`}>
              <span>所属ギルド</span>
              <input disabled={!isDetailEnabled('guild')} value={value.guild} maxLength={18} onChange={(event) => update('guild', event.target.value)} />
            </label>
            <label className={`field${isDetailEnabled('playHistory') ? '' : ' field-disabled'}`}>
              <span>コンパス歴</span>
              <input disabled={!isDetailEnabled('playHistory')} value={value.playHistory} maxLength={12} onChange={(event) => update('playHistory', event.target.value)} />
            </label>
            <label className={`field${isDetailEnabled('xId') ? '' : ' field-disabled'}`}>
              <span>X（Twitter）のID</span>
              <input disabled={!isDetailEnabled('xId')} value={value.xId} maxLength={28} placeholder="@player_id" onChange={(event) => update('xId', event.target.value)} />
            </label>
            <label className={`field${isDetailEnabled('discordId') ? '' : ' field-disabled'}`}>
              <span>DiscordのID</span>
              <input disabled={!isDetailEnabled('discordId')} value={value.discordId} maxLength={32} placeholder="player_id" onChange={(event) => update('discordId', event.target.value)} />
            </label>
            <label className={`field${isDetailEnabled('playStyle') ? '' : ' field-disabled'}`}>
              <span>プレイスタイル</span>
              <input disabled={!isDetailEnabled('playStyle')} value={value.playStyle} maxLength={24} onChange={(event) => update('playStyle', event.target.value)} />
            </label>
            <label className={`field${isDetailEnabled('activeTime') ? '' : ' field-disabled'}`}>
              <span>主な活動時間</span>
              <input disabled={!isDetailEnabled('activeTime')} value={value.activeTime} maxLength={24} onChange={(event) => update('activeTime', event.target.value)} />
            </label>
            <label className={`field field-wide${isDetailEnabled('favoriteHero') ? '' : ' field-disabled'}`}>
              <span>推しヒーロー</span>
              <select disabled={!isDetailEnabled('favoriteHero')} value={value.favoriteHero} onChange={(event) => update('favoriteHero', event.target.value)}>
                {roles.map(({ key, label }) => (
                  <optgroup key={key} label={label}>
                    {hero[key].map((item) => <option key={`${key}-${item.fullName}`} value={item.fullName}>{item.fullName}</option>)}
                  </optgroup>
                ))}
              </select>
            </label>
            <div className={`field field-wide${isDetailEnabled('seriousLevel') ? '' : ' field-disabled'}`}>
              <span>ガチ度 <strong>{seriousLevelLabels[value.seriousLevel - 1] ?? seriousLevelLabels[0]}</strong></span>
              <div className="heat-selector" role="group" aria-label="ガチ度を1から5で選択" aria-disabled={!isDetailEnabled('seriousLevel')}>
                {[1, 2, 3, 4, 5].map((level) => (
                  <button
                    type="button"
                    disabled={!isDetailEnabled('seriousLevel')}
                    key={level}
                    className={`${level <= value.seriousLevel ? 'active' : ''}${level === value.seriousLevel ? ' selected' : ''}`}
                    aria-label={`ガチ度：${seriousLevelLabels[level - 1]}、炎${level}つ`}
                    aria-pressed={level === value.seriousLevel}
                    onClick={() => update('seriousLevel', level)}
                  ><LocalFireDepartmentRoundedIcon aria-hidden="true" /></button>
                ))}
              </div>
              <div className="heat-scale-labels" aria-hidden="true"><span>エンジョイ</span><span>ガチ</span></div>
            </div>
            <fieldset disabled={!isDetailEnabled('iconCounts')} className={`field field-wide icon-count-fieldset${isDetailEnabled('iconCounts') ? '' : ' field-disabled'}`}>
              <legend>所持アイコン数</legend>
              <p className="icon-count-hint" id={ICON_COUNT_HINT_ID}>
                正確な個数が分からない場合は、「12～」「12＋」「12↑」のように入力できます。0または未記入のアイコンは履歴書に表示されません。
              </p>
              <div className="icon-count-input-grid">
                {([
                  ['goldIconCount', '金', 'gold'],
                  ['silverIconCount', '銀', 'silver'],
                  ['bronzeIconCount', '銅', 'bronze'],
                  ['tournamentIconCount', '大会', 'tournament'],
                ] as const).map(([key, label, tone]) => (
                  <label className="icon-count-input" key={key}>
                    <span className={`award-icon award-${tone}`} aria-hidden="true"><i>{label.slice(0, 1)}</i></span>
                    <span className="icon-count-input-copy">{label}</span>
                    <input
                      aria-label={`${label}アイコン数`}
                      aria-describedby={ICON_COUNT_HINT_ID}
                      inputMode="text"
                      value={value[key]}
                      maxLength={5}
                      onBlur={() => {
                        if (!/[0-9]/.test(value[key])) update(key, '')
                      }}
                      onChange={(event) => update(key, sanitizeIconCount(event.target.value))}
                    />
                  </label>
                ))}
              </div>
            </fieldset>
          </div>
          <div className={`custom-detail-fields${isDetailEnabled('custom') || isDetailEnabled('custom2') || isDetailEnabled('custom3') ? '' : ' fields-disabled'}`}>
            {([
              ['custom', '自由項目A', 'customDetailLabel', 'customDetailValue', 28],
              ['custom2', '自由項目B', 'customDetailLabel2', 'customDetailValue2', 28],
              ['custom3', '自由項目L（横長・2枠使用）', 'customDetailLabel3', 'customDetailValue3', 56],
            ] as const).map(([detailKey, legend, labelKey, valueKey, valueMaxLength]) => {
              const enabled = isDetailEnabled(detailKey)
              return (
                <fieldset disabled={!enabled} className={`custom-detail-fieldset${enabled ? '' : ' fields-disabled'}`} key={detailKey}>
                  <legend>{legend}</legend>
                  <div className="field-grid">
                    <label className={`field${enabled ? '' : ' field-disabled'}`}>
                      <span>見出し</span>
                      <input value={value[labelKey]} maxLength={14} placeholder="例：好きなカード" onChange={(event) => update(labelKey, event.target.value)} />
                    </label>
                    <label className={`field${enabled ? '' : ' field-disabled'}`}>
                      <span>内容</span>
                      <input value={value[valueKey]} maxLength={valueMaxLength} placeholder="自由に入力" onChange={(event) => update(valueKey, event.target.value)} />
                    </label>
                  </div>
                </fieldset>
              )
            })}
          </div>
        </div>
      </section>

      <section className="form-section">
        <h3><span>03</span> 使用ヒーロー・ひとこと</h3>
        <div className="hero-selection-heading">
          <p id="hero-selection-hint">使用ヒーローは重複なしで1〜6体まで選べます。「練習中」にすると画像内のヒーロー名に初心者マークが付きます。</p>
          <output aria-live="polite"><strong>{value.heroSelections.length}</strong> / 6</output>
        </div>
        <div className="hero-selects">
          {value.heroSelections.map((selection, index) => (
            <div className="hero-select-row" key={index}>
              <label className="field">
                <span>使用ヒーロー {String.fromCharCode(65 + index)}</span>
                <select aria-describedby="hero-selection-hint" value={selection} onChange={(e) => updateHero(index, e.target.value)}>
                  {roles.map(({ key, label }) => (
                    <optgroup key={key} label={label}>
                      {heroOptions.filter((item) => item.role === key).map((item) => (
                        <option
                          key={`${key}-${item.fullName}`}
                          value={item.fullName}
                          disabled={value.heroSelections.some((selected, selectedIndex) => selectedIndex !== index && selected === item.fullName)}
                        >
                          {item.fullName}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </label>
              <label className="hero-practice-toggle">
                <input
                  type="checkbox"
                  checked={value.practicingHeroes.includes(selection)}
                  aria-label={`${selection}を練習中として表示`}
                  onChange={() => toggleHeroPractice(selection)}
                />
                <span aria-hidden="true">🔰</span>
                <span>練習中</span>
              </label>
              <button
                className="hero-remove-button"
                type="button"
                disabled={value.heroSelections.length === 1}
                aria-label={`使用ヒーロー ${String.fromCharCode(65 + index)} を削除`}
                onClick={() => removeHero(index)}
              >
                <CloseRoundedIcon />
              </button>
            </div>
          ))}
        </div>
        <button className="hero-add-button" type="button" disabled={value.heroSelections.length >= 6} onClick={addHero}>
          <AddRoundedIcon /> ヒーローを追加
        </button>
        <div className="field-grid spaced-grid">
          <label className="field field-wide">
            <span>ひとこと</span>
            <textarea
              value={value.comment}
              maxLength={COMMENT_MAX_LENGTH}
              rows={2}
              onChange={(e) => update('comment', normalizeComment(e.target.value))}
            />
            <small>{value.comment.length} / {COMMENT_MAX_LENGTH}</small>
          </label>
        </div>
      </section>

      <section className="form-section avatar-section">
        <div className="avatar-heading">
          <div className="avatar-copy">
            <h3><span>04</span> プレイヤーアイコン</h3>
            <p>GIF・APNG・アニメーションWebPにも対応。枠の形と画像の見せ方を選択できます。</p>
          </div>
          <div className="avatar-actions">
            <button className="upload-button" type="button" disabled={!value.showPlayerIcon} onClick={() => fileRef.current?.click()}>
              <AddPhotoAlternateRoundedIcon /> 画像を選ぶ
            </button>
            {value.avatarDataUrl && (
              <button
                className="icon-button"
                type="button"
                disabled={!value.showPlayerIcon}
                aria-label="アイコン画像を削除"
                onClick={() => {
                  update('avatarDataUrl', '')
                  setAvatarFeedback(null)
                }}
              >
                <DeleteOutlineRoundedIcon />
              </button>
            )}
            <input
              ref={fileRef}
              hidden
              disabled={!value.showPlayerIcon}
              type="file"
              accept="image/png,image/apng,image/jpeg,image/webp,image/gif,.apng"
              aria-describedby={avatarFeedback || getAnimatedImageFormatFromDataUrl(value.avatarDataUrl) ? AVATAR_FEEDBACK_ID : undefined}
              onChange={(event) => void handleAvatar(event)}
            />
          </div>
        </div>
        {(avatarFeedback || getAnimatedImageFormatFromDataUrl(value.avatarDataUrl)) && (
          <output
            id={AVATAR_FEEDBACK_ID}
            className={`avatar-feedback avatar-feedback-${avatarFeedback?.tone ?? 'gif'}`}
            role={avatarFeedback?.tone === 'error' ? 'alert' : 'status'}
            aria-live="polite"
          >
            {avatarFeedback?.message ?? 'アニメーション画像：プレビューが動き、GIF形式でも保存できます。'}
          </output>
        )}
        <fieldset className="avatar-choice-fieldset" disabled={!value.showPlayerIcon}>
          <legend>枠の形</legend>
          <div className="avatar-choice-options">
            {avatarFrameOptions.map(({ value: frame, label, description, recommended }) => (
              <label className={`avatar-choice-option${value.avatarFrame === frame ? ' selected' : ''}`} key={frame}>
                <input
                  type="radio"
                  name="avatarFrame"
                  value={frame}
                  checked={value.avatarFrame === frame}
                  onChange={() => update('avatarFrame', frame)}
                />
                <span className={`avatar-choice-demo avatar-frame-demo avatar-frame-demo-${frame}`} aria-hidden="true"><i /></span>
                <span className="avatar-choice-copy">
                  <strong>{label}{recommended && <b>標準</b>}</strong>
                  <small>{description}</small>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset className="avatar-choice-fieldset" disabled={!value.showPlayerIcon}>
          <legend>画像の見せ方</legend>
          <div className="avatar-choice-options">
            {avatarFitOptions.map(({ value: fit, label, description, recommended }) => (
              <label className={`avatar-choice-option${value.avatarFit === fit ? ' selected' : ''}`} key={fit}>
                <input
                  type="radio"
                  name="avatarFit"
                  value={fit}
                  checked={value.avatarFit === fit}
                  onChange={() => update('avatarFit', fit)}
                />
                <span className={`avatar-choice-demo avatar-fit-demo avatar-fit-demo-${fit}`} aria-hidden="true"><i /></span>
                <span className="avatar-choice-copy">
                  <strong>{label}{recommended && <b>おすすめ</b>}</strong>
                  <small>{description}</small>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
        <label className="avatar-visibility-toggle">
          <input
            type="checkbox"
            checked={!value.showPlayerIcon}
            onChange={(event) => update('showPlayerIcon', !event.target.checked)}
          />
          <span>プレイヤーアイコン枠を表示しない（自分でイラストを書き込む人用）</span>
        </label>
      </section>

      <ThemeColorControl hue={value.themeHue} onCommit={(nextHue) => update('themeHue', nextHue)} />

      <section className="form-section editor-save-section" aria-labelledby="editor-save-title">
        <div className="editor-save-heading">
          <div>
            <h3 id="editor-save-title"><span>06</span> バックアップ・復元</h3>
            <p>
              {cacheStatus === 'error'
                ? '現在はブラウザへ自動保存できません。ファイルか文字でバックアップを残してください。'
                : '入力内容はこのブラウザへ自動保存されます。端末を変えるときは、ファイルか文字でも手元に残せます。'}
            </p>
          </div>
        </div>
        <div className="editor-save-grid">
          {cacheStatus === 'error' ? (
            <button
              className="storage-warning-button"
              type="button"
              aria-haspopup="dialog"
              aria-controls="storage-warning-dialog"
              onClick={onShowStorageWarning}
            >
              <WarningAmberRoundedIcon aria-hidden="true" />
              <span>
                <strong>ブラウザに保存できません</strong>
                <small>入力内容が失われる可能性があります。詳細を確認</small>
              </span>
              <ChevronRightRoundedIcon className="storage-warning-chevron" aria-hidden="true" />
            </button>
          ) : (
            <output className={`cache-status cache-status-${cacheStatus}`} aria-live="polite">
              <StorageRoundedIcon aria-hidden="true" />
              <span>
                <strong>{cacheStatus === 'saved' ? 'ブラウザに自動保存済み' : '画像を除いて自動保存済み'}</strong>
                <small>
                  {cacheStatus === 'saved'
                    ? 'このブラウザ内に入力内容を保持しています'
                    : '画像が大きいため、プロフィール項目のみ保存しています'}
                </small>
              </span>
            </output>
          )}
          <button className="json-save-button" type="button" onClick={onSaveBackupFile}>
            <SaveAltRoundedIcon aria-hidden="true" />
            <span>
              <strong>バックアップファイルを保存</strong>
              <small>入力内容を端末へダウンロード</small>
            </span>
          </button>
        </div>
        <div className="backup-restore-panel">
          <div className="backup-restore-heading">
            <div>
              <h4>文字で保存・復元</h4>
              <p id={BACKUP_TEXT_HINT_ID}>この枠の文字をメモ帳などへ保存できます。復元するときは文字を貼り付けて読み込んでください。</p>
            </div>
            <button className="backup-refresh-button" type="button" onClick={refreshBackupText}>
              <RefreshRoundedIcon aria-hidden="true" /> 現在の内容を反映
            </button>
          </div>
          <textarea
            className="backup-textarea"
            value={backupText}
            rows={10}
            spellCheck={false}
            aria-label="バックアップ用テキスト"
            aria-describedby={`${BACKUP_TEXT_HINT_ID}${backupFeedback ? ` ${BACKUP_FEEDBACK_ID}` : ''}`}
            aria-invalid={backupFeedback?.tone === 'error'}
            onChange={(event) => {
              setBackupText(event.target.value)
              setBackupTextDirty(true)
              setBackupFeedback(null)
            }}
          />
          <div className="backup-restore-actions">
            <button className="backup-file-button" type="button" onClick={() => backupFileRef.current?.click()}>
              <FileUploadRoundedIcon aria-hidden="true" /> ファイルから読み込む
            </button>
            <input
              ref={backupFileRef}
              hidden
              type="file"
              accept=".json,application/json,text/plain"
              onChange={handleBackupFile}
            />
            <button className="backup-apply-button" type="button" onClick={() => applyBackupText(backupText)}>
              <RestoreRoundedIcon aria-hidden="true" /> この文字を読み込む
            </button>
          </div>
          {backupFeedback && (
            <output
              id={BACKUP_FEEDBACK_ID}
              className={`backup-feedback backup-feedback-${backupFeedback.tone}`}
              role={backupFeedback.tone === 'error' ? 'alert' : 'status'}
              aria-live="polite"
            >
              {backupFeedback.message}
            </output>
          )}
        </div>
      </section>
    </div>
  )
}

export default Input
