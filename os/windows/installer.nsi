; NSIS packaging/install script
; Docs: http://nsis.sourceforge.net/Docs/Contents.html

; --------------------------------
; Variables
; --------------------------------

!define dest "{{dest}}"
!define src "{{src}}"
!define name "{{name}}"
!define prettyName "{{prettyName}}"
!define icon "{{icon}}"

!define exec "nw.exe"

!define regkey "Software\${name}"
!define uninstkey "Software\Microsoft\Windows\CurrentVersion\Uninstall\${name}"

!define uninstaller "uninstall.exe"

; --------------------------------
; Installation
; --------------------------------

SetCompressor lzma

XPStyle on
ShowInstDetails nevershow
AutoCloseWindow false

Name "${name}"
Icon "${icon}"
OutFile "${dest}"

CRCCheck on
SilentInstall normal

InstallDir "$PROGRAMFILES\${name}"
InstallDirRegKey HKLM "${regkey}" ""

Caption "${prettyName} Setup"
; Don't add sub-captions to title bar
SubCaption 3 " "
SubCaption 4 " "

Page instfiles

Section "Install"
    
    WriteRegStr HKLM "${regkey}" "Install_Dir" "$INSTDIR"
    WriteRegStr HKLM "${uninstkey}" "DisplayName" "${name}"
    WriteRegStr HKLM "${uninstkey}" "DisplayIcon" '"$INSTDIR\icon.ico"'
    WriteRegStr HKLM "${uninstkey}" "UninstallString" '"$INSTDIR\${uninstaller}"'
    
    SetOutPath $INSTDIR
    
    ; Include all files from /build directory
    File /r "${src}\*"
    
    ; Create start menu shortcut
    CreateShortCut "$SMPROGRAMS\${name}.lnk" "$INSTDIR\${exec}" "" "$INSTDIR\icon.ico"
    
    WriteUninstaller "${uninstaller}"
    
SectionEnd

; --------------------------------
; Uninstaller
; --------------------------------

ShowUninstDetails nevershow

UninstallCaption "Uninstall ${prettyName}"
UninstallText "Don't like ${prettyName} anymore? Hit uninstall button."
UninstallIcon "${icon}"

UninstPage uninstConfirm
UninstPage instfiles

Section "Uninstall"
    
    DeleteRegKey HKLM "${uninstkey}"
    DeleteRegKey HKLM "${regkey}"
    
    Delete "$SMPROGRAMS\${name}.lnk"
    
    Delete "$INSTDIR"
    
SectionEnd