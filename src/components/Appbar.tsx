import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import HomeIcon from '@mui/icons-material/Home';
import ShareIcon from '@mui/icons-material/Share';
import { BsTwitter, BsCopy } from "react-icons/bs";
import { SiMisskey, SiMastodon, SiLine, SiX } from "react-icons/si";
import { FaHashtag } from "react-icons/fa";
import { Alert, Box, IconButton, Menu, MenuItem, Snackbar } from '@mui/material';
import { useEffect, useState, type ReactElement } from 'react';


const appNamePrefix = "コンパス履歴書"
const appNameSuffix = "ジェネレーター V2"

function ResponsiveAppBar() {


  const [url, setUrl] = useState("https://example.com");
  useEffect(() => {
    const { URL } = document
    setUrl(URL)
  })

  const shareText = "#コンパス履歴書ジェネレーター でコンパスの履歴書を作ろう！"
  const encodedShareText = encodeURIComponent(shareText);
  type shareOption = {
    name: string,
    link: string | Function,
    icon: ReactElement,
    id: number,
    // message?: string,
  }
  const shareOptions: shareOption[] = [
    {
      name: "URLをコピー",
      link: () => navigator.clipboard.writeText(`${shareText}\n${url}`),
      icon: <BsCopy />,
      id: 201,
      // message: t("header.tooltip.copy"),
    },
    {
      name: "Twitter",
      link: `https://x.com/share?text=${encodedShareText}&url=${url}`,
      icon: <BsTwitter />,
      id: 1,
    },
    {
      name: "X",
      link: `https://x.com/share?text=${encodedShareText}&url=${url}`,
      icon: <SiX />,
      id: 2,
    },
    {
      name: "Misskey",
      link: `https://misskey-hub.net/share/?text=${encodedShareText}&url=${url}&visibility=public&localOnly=0`,
      icon: <SiMisskey />,
      id: 21,
    },
    {
      name: "Mastodon",
      link: `https://donshare.net/share.html?text=${encodedShareText}&url=${url}`,
      icon: <SiMastodon />,
      id: 22,
    },
    {
      name: "Line",
      link: `https://social-plugins.line.me/lineit/share?text=${encodedShareText}&url=${url}`,
      icon: <SiLine />,
      id: 101,
    },
  ]

  const [isCopyMessageOpen, setIsCopyMessageOpen] = useState(false)
  const openCopyMessage = () => {
    setIsCopyMessageOpen(true);
  }
  const handleCopyMessageClose = () => {
    setIsCopyMessageOpen(false);
  };

  const [anchorElShare, setAnchorElShare] = useState<null | HTMLElement>(null);

  const handleOpenShareMenu = (e: React.MouseEvent<HTMLElement>) => {
    setAnchorElShare(e.currentTarget);
  }

  const handleCloseShareMenu = () => {
    setAnchorElShare(null);
  };

  return (
    <AppBar position="static">
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          <FaHashtag fontSize="1.65rem" />
          <Typography
            variant="h6"
            noWrap
            sx={{
              fontFamily: 'monospace',
              fontWeight: 700,
              letterSpacing: '.2rem',
              color: 'inherit',
              textDecoration: 'none',
              fontSize: { xs: '1.3rem', sm: '1.7rem' },
              display: 'flex',
              alignItems: 'flex-end'
            }}
          >
            {appNamePrefix}
            <Box component="span" sx={{ display: { xs: "none", sm: "block" }, fontSize: { xs: '1.0rem', sm: '1.3rem', md: '1.7rem' } }}>
              {appNameSuffix}
            </Box>
          </Typography>
          <IconButton component="a" href="https://aosankaku.net" target="_blank" sx={{ marginLeft: 'auto' }}>
            <HomeIcon sx={{ color: 'white' }} />
          </IconButton>
          <IconButton onClick={handleOpenShareMenu}>
            <ShareIcon sx={{ color: 'white' }} />
          </IconButton>
          <Menu
            sx={{ mt: '45px' }}
            id="menu-appbar"
            anchorEl={anchorElShare}
            anchorOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            keepMounted
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            open={Boolean(anchorElShare)}
            onClose={handleCloseShareMenu}
            disableScrollLock={true}
          >
            {shareOptions.map((e) => (
              <MenuItem
                key={e.id}
                style={{ display: 'flex', gap: '10px' }}
                component="a"
                href={typeof e.link === 'string' ? e.link : undefined}
                onClick={() => {
                  handleCloseShareMenu();
                  if (typeof e.link === 'function') {
                    openCopyMessage();
                    e.link();
                  }
                }}
                target={typeof e.link === 'string' ? '_blank' : undefined}
                rel={typeof e.link === 'string' ? 'noopener noreferrer' : undefined}
              >
                {e.icon}<Typography textAlign="center">{e.name}</Typography>
              </MenuItem>
            ))}
          </Menu>
        </Toolbar>
      </Container>
      <Snackbar open={isCopyMessageOpen} autoHideDuration={6000} onClose={handleCopyMessageClose}>
        <Alert
          onClose={handleCopyMessageClose}
          severity="success"
          variant="filled"
          sx={{ width: '100%' }}
        >
          共有リンクとテキストをコピーしました！
        </Alert>
      </Snackbar>
    </AppBar>
  );
}

export default ResponsiveAppBar;
