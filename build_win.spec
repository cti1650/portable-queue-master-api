# -*- mode: python ; coding: utf-8 -*-
from PyInstaller.utils.hooks import collect_all

# FastAPI/Uvicorn/Pydantic/SQLAlchemyの依存関係を収集
datas, binaries, hiddenimports = collect_all('fastapi')
a = collect_all('uvicorn')
b = collect_all('pydantic')
c = collect_all('sqlalchemy')

datas.extend(a[0])
binaries.extend(a[1])
hiddenimports.extend(a[2])

datas.extend(b[0])
binaries.extend(b[1])
hiddenimports.extend(b[2])

datas.extend(c[0])
binaries.extend(c[1])
hiddenimports.extend(c[2])

# 💡 staticフォルダ全体を同梱する
datas.append(('static', 'static'))
datas.append(('queue_data.db', '.')) # DBファイルも同梱

block_cipher = None

a = Analysis(['main.py'],
             pathex=['.'],
             binaries=[],
             datas=datas, 
             hiddenimports=hiddenimports,
             hookspath=[],
             runtime_hooks=[],
             excludes=[],
             win_no_prefer_redirects=False,
             win_private_assemblies=False,
             cipher=block_cipher,
             noarchive=False)
pyz = PYZ(a.pure, a.zipped_data,
             cipher=block_cipher)
exe = EXE(pyz,
          a.scripts,
          a.binaries,
          a.zipfiles,
          a.datas,
          [],
          name='pqmaster_win', # 実行ファイル名
          debug=False,
          bootloader_ignore_signals=False,
          strip=False,
          upx=True,
          upx_exclude=[],
          runtime_tmpdir=None,
          console=True, 
          disable_windowed_traceback=False,
          target_arch=None,
          codesign_identity=None,
          entitlements_file=None )
