import { useEffect } from 'react'
import Cookies from 'js-cookie'
import styled from 'styled-components'
// import { isEditMode } from '../../utils'
import { useCMS, useSubscribable } from 'tinacms'
import { getUser, getBranch } from '../../open-authoring/github/api'

function popupWindow(url, title, window, w, h) {
  const y = window.top.outerHeight / 2 + window.top.screenY - h / 2
  const x = window.top.outerWidth / 2 + window.top.screenX - w / 2
  return window.open(
    url,
    title,
    'toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=no, resizable=no, copyhistory=no, width=' +
      w +
      ', height=' +
      h +
      ', top=' +
      y +
      ', left=' +
      x
  )
}

export const EditLink = () => {
  let authTab: Window
  const cms = useCMS()

  let _isEditMode = !cms.sidebar.hidden

  useSubscribable(cms.sidebar, () => {
    _isEditMode = !cms.sidebar.hidden
  })

  // useEffect(() => {
  //   _isEditMode = !cms.sidebar.hidden
  // }, [cms.sidebar.hidden])

  const isTokenValid = async () => {
    const userData = await getUser()
    if (!userData) return false
    return true
  }

  const isForkValid = async (fork: string) => {
    const branch = Cookies.get('head_branch') || 'master'

    const forkData = await getBranch(fork, branch)
    if (!forkData) return false
    if (forkData.ref === 'refs/heads/' + branch) {
      Cookies.set('head_branch', branch)
      return true
    }
    return false
  }

  const authState = Math.random()
    .toString(36)
    .substring(7)

  const exitEditMode = () => {
    fetch(`/api/reset-preview`).then(() => {
      window.location.reload()
    })
  }

  const enterEditMode = async () => {
    const accessTokenAlreadyExists = await isTokenValid()
    const fork = Cookies.get('fork_full_name')

    localStorage.setItem('fork_full_name', '')
    if (accessTokenAlreadyExists) {
      if (fork && (await isForkValid(fork))) {
        handleForkCreated(fork)
        return
      } else {
        authTab = popupWindow(
          `/github/fork?state=${authState}`,
          '_blank',
          window,
          1000,
          700
        )
      }
    } else {
      authTab = popupWindow(
        `/github/start-auth?state=${authState}`,
        '_blank',
        window,
        1000,
        700
      )
    }

    // window.addEventListener(
    //   'storage',
    //   e => {
    //     updateStorageEvent(e, authState)
    //     authTab.location.assign(`/github/fork`)
    //   },
    //   true
    // )
  }

  useEffect(() => {
    // return () => {
    //   window.removeEventListener(
    //     'storage',
    //     e => updateStorageEvent(e, authState),
    //     true
    //   )
    // }
  }, [])

  return (
    <EditButton id="OpenAuthoringEditButton" onClick={_isEditMode ? exitEditMode : enterEditMode}>
      {_isEditMode ? 'Exit Edit Mode' : 'Edit This Site'}
    </EditButton>
  )
}

// async function updateStorageEvent(e, authState: string) {
//   if (e.key == 'github_code') {
//     await handleAuthCode(e.newValue, authState)
//   }
//   if (e.key == 'fork_full_name') {
//     handleForkCreated(e.newValue)
//   }
// }



async function handleForkCreated(forkName: string) {
  Cookies.set('fork_full_name', forkName, { sameSite: 'strict' })
  fetch(`/api/preview`).then(() => {
    window.location.href = window.location.pathname // drops the autoAuth query param
  })
}

const requestGithubAccessToken = async (code: string, authState: string) => {
  const resp = await fetch(
    `/api/get-github-access-token?code=${code}&state=${authState}`
  )
}

const EditButton = styled.button`
  background: none;
  padding: 0;
  display: inline;
  border: none;
  outline: none;
  cursor: pointer;
  color: white;
  transition: all 150ms ease-out;
  transform: translate3d(0px, 0px, 0px);

  &:hover,
  &:focus {
    text-decoration: none;
    transform: translate3d(-1px, -2px, 0);
    transition: transform 180ms ease-out;
  }
  &:focus,
  &:active {
    outline: none;
  }
  &:active {
    filter: none;
  }
`
