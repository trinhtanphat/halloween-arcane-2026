Add-Type -AssemblyName System.Drawing
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
foreach ($size in @(192,512)) {
    $bmp = [System.Drawing.Bitmap]::new($size,$size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    try {
        $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
        $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
        $g.Clear([System.Drawing.ColorTranslator]::FromHtml('#170f24'))
        $gold = [System.Drawing.ColorTranslator]::FromHtml('#e9b868')
        $soft = [System.Drawing.ColorTranslator]::FromHtml('#fce0aa')
        $line = [System.Drawing.Pen]::new($gold, [single]($size*0.013))
        $shade = [System.Drawing.SolidBrush]::new($soft)
        $diamond = [System.Drawing.PointF[]]@(
            [System.Drawing.PointF]::new([single]($size*0.5),[single]($size*0.12)),
            [System.Drawing.PointF]::new([single]($size*0.88),[single]($size*0.5)),
            [System.Drawing.PointF]::new([single]($size*0.5),[single]($size*0.88)),
            [System.Drawing.PointF]::new([single]($size*0.12),[single]($size*0.5))
        )
        $g.DrawPolygon($line,$diamond)
        $g.DrawEllipse($line,[single]($size*0.195),[single]($size*0.195),[single]($size*0.61),[single]($size*0.61))
        $font = [System.Drawing.Font]::new('Georgia',[single]($size*0.49),[System.Drawing.FontStyle]::Regular,[System.Drawing.GraphicsUnit]::Pixel)
        $format=[System.Drawing.StringFormat]::new()
        $format.Alignment=[System.Drawing.StringAlignment]::Center
        $format.LineAlignment=[System.Drawing.StringAlignment]::Center
        $textBounds=[System.Drawing.RectangleF]::new([single]($size*0.08),[single]($size*0.08),[single]($size*0.84),[single]($size*0.84))
        $g.DrawString('R',$font,$shade,$textBounds,$format)
        $output = Join-Path $root "icon-$size.png"
        $bmp.Save($output,[System.Drawing.Imaging.ImageFormat]::Png)
        Write-Output "$output $((Get-Item $output).Length) bytes"
        $font.Dispose();$format.Dispose();$shade.Dispose();$line.Dispose()
    } finally {
        $g.Dispose()
        $bmp.Dispose()
    }
}
