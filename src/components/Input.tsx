import { useEffect, useMemo, useRef, useState, type ChangeEvent, type CSSProperties } from 'react'
import AddPhotoAlternateRoundedIcon from '@mui/icons-material/AddPhotoAlternateRounded'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'
import LocalFireDepartmentRoundedIcon from '@mui/icons-material/LocalFireDepartmentRounded'
import RestartAltRoundedIcon from '@mui/icons-material/RestartAltRounded'
import SaveAltRoundedIcon from '@mui/icons-material/SaveAltRounded'
import StorageRoundedIcon from '@mui/icons-material/StorageRounded'
import { hero, ranks } from '../data/main'
import { detailOptions, DETAIL_LIMIT, type DetailKey } from '../details'
import { getThemeColor, getThemeContrastColor } from '../theme'
import type { CacheStatus, ResumeData, Role } from '../types'

type Props = {
  value: ResumeData
  onChange: (next: ResumeData) => void
  onReset: () => void
  onSaveJson: () => void
  cacheStatus: CacheStatus
}

const roles: { key: Role; label: string }[] = [
  { key: 'attacker', label: 'アタッカー' },
  { key: 'gunner', label: 'ガンナー' },
  { key: 'tank', label: 'タンク' },
  { key: 'sprinter', label: 'スプリンター' },
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
          <p id="theme-color-hint">変更できるのは色相だけです。彩度92%・明るさ60%に固定しています。</p>
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

function Input({ value, onChange, onReset, onSaveJson, cacheStatus }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const heroOptions = useMemo(
    () => roles.flatMap(({ key, label }) => hero[key].map((item) => ({ ...item, role: key, roleLabel: label }))),
    [],
  )

  const update = <K extends keyof ResumeData>(key: K, next: ResumeData[K]) => {
    onChange({ ...value, [key]: next })
  }

  const updateHero = (index: number, next: string) => {
    if (value.heroSelections.some((selection, itemIndex) => itemIndex !== index && selection === next)) return
    const selections = [...value.heroSelections]
    selections[index] = next
    update('heroSelections', selections)
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
    update('heroSelections', value.heroSelections.filter((_, itemIndex) => itemIndex !== index))
  }

  const toggleDetail = (key: DetailKey) => {
    const selected = value.selectedDetailKeys.includes(key)
    if (selected) {
      update('selectedDetailKeys', value.selectedDetailKeys.filter((item) => item !== key))
      return
    }
    if (value.selectedDetailKeys.length >= DETAIL_LIMIT) return
    update('selectedDetailKeys', [...value.selectedDetailKeys, key])
  }

  const isDetailEnabled = (key: DetailKey) => value.selectedDetailKeys.includes(key)

  const handleAvatar = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => update('avatarDataUrl', String(reader.result ?? ''))
    reader.readAsDataURL(file)
  }

  return (
    <div className="editor-panel">
      <div className="editor-heading">
        <div>
          <span className="eyebrow">PLAYER DATA</span>
          <h2>プロフィールを入力</h2>
          <output className={`cache-status cache-status-${cacheStatus}`} aria-live="polite">
            <StorageRoundedIcon aria-hidden="true" fontSize="inherit" />
            {cacheStatus === 'saved' && 'ブラウザに自動保存済み'}
            {cacheStatus === 'without-image' && '画像を除いて自動保存済み'}
            {cacheStatus === 'error' && 'ブラウザに保存できません'}
          </output>
        </div>
        <div className="editor-heading-actions">
          <button className="text-button json-save-button" type="button" onClick={onSaveJson}>
            <SaveAltRoundedIcon fontSize="small" /> JSONで保存
          </button>
          <button className="text-button" type="button" onClick={onReset}>
            <RestartAltRoundedIcon fontSize="small" /> 初期値に戻す
          </button>
        </div>
      </div>

      <section className="form-section">
        <h3><span>01</span> 基本プロフィール</h3>
        <p className="section-note">ランクはどちらも任意です。通算・シーズンの片方だけでも、両方未記入でも作成できます。</p>
        <div className="field-grid">
          <label className="field field-wide">
            <span>プレイヤー名 <b>必須</b></span>
            <input value={value.playerName} maxLength={22} onChange={(e) => update('playerName', e.target.value)} />
          </label>
          <label className="field field-wide">
            <span>よみ・呼び方</span>
            <input value={value.pronunciation} maxLength={28} onChange={(e) => update('pronunciation', e.target.value)} />
          </label>
          <label className="field">
            <span>最高到達ランク <em>任意</em></span>
            <select name="highestRank" data-testid="highest-rank" value={value.highestRank} onChange={(e) => update('highestRank', e.target.value)}>
              <option value="">未記入</option>
              {ranks.map((rank) => <option key={rank}>{rank}</option>)}
            </select>
          </label>
          <label className="field">
            <span>最高シーズン到達ランク <em>任意</em></span>
            <select name="seasonHighestRank" data-testid="season-highest-rank" value={value.seasonHighestRank} onChange={(e) => update('seasonHighestRank', e.target.value)}>
              <option value="">未記入</option>
              {ranks.map((rank) => <option key={rank}>{rank}</option>)}
            </select>
          </label>
          <label className="field">
            <span>最高デッキレベル</span>
            <input inputMode="numeric" value={value.maxDeckLevel} maxLength={3} onChange={(e) => update('maxDeckLevel', e.target.value.replace(/\D/g, ''))} />
          </label>
        </div>
      </section>

      <section className="form-section detail-picker-section" aria-labelledby="detail-picker-title">
        <div className="detail-picker-heading">
          <div>
            <h3 id="detail-picker-title"><span>02</span> 履歴書に乗せる追加情報</h3>
            <p id="detail-picker-hint">右下へ載せる項目を0〜6個選んでください。選んだ項目だけ入力できます。</p>
          </div>
          <output className="detail-count" aria-live="polite">
            <strong>{value.selectedDetailKeys.length}</strong> / {DETAIL_LIMIT}
          </output>
        </div>
        <div className="detail-option-grid" role="group" aria-describedby="detail-picker-hint">
          {detailOptions.map(({ key, label, description }) => {
            const selected = value.selectedDetailKeys.includes(key)
            const disabled = !selected && value.selectedDetailKeys.length >= DETAIL_LIMIT
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
                  <strong>{label}</strong>
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
              <input disabled={!isDetailEnabled('supportCode')} value={value.applicationCode} maxLength={18} onChange={(event) => update('applicationCode', event.target.value)} />
            </label>
            <label className={`field${isDetailEnabled('gender') ? '' : ' field-disabled'}`}>
              <span>性別</span>
              <select disabled={!isDetailEnabled('gender')} value={value.gender} onChange={(event) => update('gender', event.target.value)}>
                {['未回答', '男性', '女性', 'その他'].map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
            <label className={`field${isDetailEnabled('accountLevel') ? '' : ' field-disabled'}`}>
              <span>アカウントレベル</span>
              <input disabled={!isDetailEnabled('accountLevel')} inputMode="numeric" value={value.accountLevel} maxLength={4} onChange={(event) => update('accountLevel', event.target.value.replace(/\D/g, ''))} />
            </label>
            <label className={`field${isDetailEnabled('friendCode') ? '' : ' field-disabled'}`}>
              <span>フレンドコード</span>
              <input disabled={!isDetailEnabled('friendCode')} value={value.friendCode} maxLength={24} onChange={(event) => update('friendCode', event.target.value)} />
            </label>
            <label className={`field${isDetailEnabled('guild') ? '' : ' field-disabled'}`}>
              <span>所属ギルド</span>
              <input disabled={!isDetailEnabled('guild')} value={value.guild} maxLength={18} onChange={(event) => update('guild', event.target.value)} />
            </label>
            <label className={`field${isDetailEnabled('playHistory') ? '' : ' field-disabled'}`}>
              <span>コンパス歴</span>
              <input disabled={!isDetailEnabled('playHistory')} value={value.playHistory} maxLength={12} onChange={(event) => update('playHistory', event.target.value)} />
            </label>
            <label className={`field${isDetailEnabled('snsId') ? '' : ' field-disabled'}`}>
              <span>SNSのID</span>
              <input disabled={!isDetailEnabled('snsId')} value={value.snsId} maxLength={28} placeholder="@player_id" onChange={(event) => update('snsId', event.target.value)} />
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
                      inputMode="numeric"
                      value={value[key]}
                      maxLength={4}
                      onChange={(event) => update(key, event.target.value.replace(/\D/g, ''))}
                    />
                  </label>
                ))}
              </div>
            </fieldset>
          </div>
          <div className={`custom-detail-fields${isDetailEnabled('custom') || isDetailEnabled('custom2') ? '' : ' fields-disabled'}`}>
          {([
            ['custom', '自由項目 1', 'customDetailLabel', 'customDetailValue'],
            ['custom2', '自由項目 2', 'customDetailLabel2', 'customDetailValue2'],
          ] as const).map(([detailKey, legend, labelKey, valueKey]) => {
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
                    <input value={value[valueKey]} maxLength={28} placeholder="自由に入力" onChange={(event) => update(valueKey, event.target.value)} />
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
          <p id="hero-selection-hint">使用ヒーローは重複なしで1〜6体まで選べます。4体以上では画像内を2列にし、英語ロール名を省略します。</p>
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
            <textarea value={value.comment} maxLength={90} rows={3} onChange={(e) => update('comment', e.target.value)} />
            <small>{value.comment.length} / 90</small>
          </label>
        </div>
      </section>

      <section className="form-section avatar-section">
        <div className="avatar-copy">
          <h3><span>04</span> プレイヤーアイコン</h3>
          <p>枠を非表示にすると、自分で絵を加えるための余白にできます。選択済みの画像は非表示にしても保持されます。</p>
          <label className="avatar-visibility-toggle">
            <input
              type="checkbox"
              checked={value.showPlayerIcon}
              onChange={(event) => update('showPlayerIcon', event.target.checked)}
            />
            <span>プレイヤーアイコン枠を履歴書に表示する</span>
          </label>
        </div>
        <div className="avatar-actions">
          <button className="upload-button" type="button" disabled={!value.showPlayerIcon} onClick={() => fileRef.current?.click()}>
            <AddPhotoAlternateRoundedIcon /> 画像を選ぶ
          </button>
          {value.avatarDataUrl && (
            <button className="icon-button" type="button" disabled={!value.showPlayerIcon} aria-label="アイコン画像を削除" onClick={() => update('avatarDataUrl', '')}>
              <DeleteOutlineRoundedIcon />
            </button>
          )}
          <input ref={fileRef} hidden disabled={!value.showPlayerIcon} type="file" accept="image/png,image/jpeg,image/webp" onChange={handleAvatar} />
        </div>
      </section>

      <ThemeColorControl hue={value.themeHue} onCommit={(nextHue) => update('themeHue', nextHue)} />
    </div>
  )
}

export default Input
