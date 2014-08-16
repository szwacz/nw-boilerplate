; NSIS packaging/install script
; Docs: http://nsis.sourceforge.net/Docs/Contents.html

!include "nsDialogs.nsh"

; --------------------------------
; Variables
; --------------------------------

!define dest "{{dest}}"
!define src "{{src}}"
!define name "{{name}}"
!define prettyName "{{prettyName}}"
!define version "{{version}}"
!define icon "{{icon}}"
!define setupIcon "{{setupIcon}}"
!define banner "{{banner}}"

!define exec "nw.exe"

!define regkey "Software\${name}"
!define uninstkey "Software\Microsoft\Windows\CurrentVersion\Uninstall\${name}"

!define uninstaller "uninstall.exe"

; --------------------------------
; Installation
; --------------------------------

;SetCompressor lzma

Name "${name}"
Icon "${setupIcon}"
OutFile "${dest}"
InstallDir "$PROGRAMFILES\${name}"
InstallDirRegKey HKLM "${regkey}" ""

CRCCheck on
SilentInstall normal

XPStyle on
ShowInstDetails nevershow
AutoCloseWindow false
WindowIcon off

Caption "${prettyName} Setup"
; Don't add sub-captions to title bar
SubCaption 3 " "
SubCaption 4 " "

Page custom welcome
Page instfiles

Var Image
Var ImageHandle

Function .onInit

    ; Extract banner image for welcome page
    InitPluginsDir
    ReserveFile "${banner}"
    File /oname=$PLUGINSDIR\banner.bmp "${banner}"

FunctionEnd

; Custom welcome page
Function welcome

    nsDialogs::Create 1018
    
    ${NSD_CreateLabel} 0 1u 210 100% "Welcome to ${prettyName} version ${version} installer.$\r$\n$\r$\nClick install button to begin."
    
    ${NSD_CreateBitmap} 228 0 170 210 ""
    Pop $Image
    ${NSD_SetImage} $Image $PLUGINSDIR\banner.bmp $ImageHandle

    nsDialogs::Show

    ${NSD_FreeImage} $ImageHandle

FunctionEnd

; Installation declarations
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
    
    RMDir /r "$INSTDIR"
    
SectionEnd