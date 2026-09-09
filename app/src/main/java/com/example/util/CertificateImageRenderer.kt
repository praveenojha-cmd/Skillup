package com.example.util

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.RectF
import android.text.Layout
import android.text.StaticLayout
import android.text.TextPaint
import com.example.R
import com.example.data.model.Certificate

/**
 * Renders the certificate as a standalone, high-resolution PNG using
 * native Canvas/Bitmap drawing — NOT a screenshot of the Compose UI, so the
 * output never contains any device/app chrome. Mirrors the same data shown
 * in CertificateDialog (CommonComponents.kt); both read from the same
 * [Certificate] instance, so the two never diverge.
 */
object CertificateImageRenderer {

    private const val WIDTH = 1240
    private const val HEIGHT = 1754
    private const val MARGIN = 90f

    private val navy = Color.parseColor("#0A2540")
    private val blue = Color.parseColor("#2563EB")
    private val gold = Color.parseColor("#F59E0B")
    private val slate400 = Color.parseColor("#94A3B8")
    private val slate500 = Color.parseColor("#64748B")
    private val slate600 = Color.parseColor("#475569")
    private val slate800 = Color.parseColor("#1E293B")
    private val green = Color.parseColor("#10B981")
    private val cardBg = Color.parseColor("#FFFBEB")

    fun render(context: Context, certificate: Certificate): Bitmap {
        val bitmap = Bitmap.createBitmap(WIDTH, HEIGHT, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(bitmap)
        canvas.drawColor(Color.WHITE)

        // Outer border frame
        val borderPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            style = Paint.Style.STROKE
            strokeWidth = 4f
            color = gold
            alpha = 140
        }
        canvas.drawRoundRect(RectF(30f, 30f, WIDTH - 30f, HEIGHT - 30f), 32f, 32f, borderPaint)

        var y = MARGIN + 10f

        // Both official assets, decoded at native resolution and drawn
        // scaled to fit a max box while preserving their original aspect
        // ratio (no stretch/crop/recolor) — same hierarchy as CertificateDialog.
        y = drawLogo(canvas, context, R.drawable.rupeek_logo, y, maxWidth = 260f, maxHeight = 100f)
        y += 20f
        y = drawLogo(canvas, context, R.drawable.skillup_academy_logo, y, maxWidth = 220f, maxHeight = 90f)
        y += 36f

        val centerX = WIDTH / 2f

        y = drawCenteredText(canvas, "CERTIFICATE OF ACHIEVEMENT", centerX, y, 42f, navy, bold = true, letterSpacing = 0.08f)
        y += 40f

        y = drawCenteredText(canvas, "This is proudly presented to", centerX, y, 26f, slate500, italic = true)
        y += 26f

        y = drawWrappedCenteredText(canvas, certificate.recipientName, centerX, y, WIDTH - 2 * MARGIN - 60f, 58f, navy, bold = true)
        y += 8f
        y = drawCenteredText(canvas, "Employee Code: ${certificate.employeeCode}", centerX, y, 24f, slate500)
        y += 40f

        y = drawCenteredText(canvas, "for successfully completing", centerX, y, 26f, slate600)
        y += 30f
        y = drawWrappedCenteredText(canvas, certificate.courseTitle, centerX, y, WIDTH - 2 * MARGIN - 60f, 36f, blue, bold = true)
        y += 50f

        // Stats card (Assessment Score / Passing Score / Modules Completed)
        val cardLeft = MARGIN
        val cardRight = WIDTH - MARGIN
        val cardTop = y
        val cardHeight = 190f
        val cardPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply { color = cardBg }
        canvas.drawRoundRect(RectF(cardLeft, cardTop, cardRight, cardTop + cardHeight), 24f, 24f, cardPaint)

        val colWidth = (cardRight - cardLeft) / 3f
        drawStatColumn(canvas, "Assessment Score", "${certificate.scorePercentage}%", cardLeft + colWidth * 0.5f, cardTop + 60f, green)
        drawStatColumn(canvas, "Passing Score", "${certificate.passingScorePercentage}%", cardLeft + colWidth * 1.5f, cardTop + 60f, slate800)
        drawStatColumn(canvas, "Modules Completed", "${certificate.totalModulesCompleted}/${certificate.totalModules}", cardLeft + colWidth * 2.5f, cardTop + 60f, slate800)

        y = cardTop + cardHeight + 56f

        // Date Awarded / Credential ID row
        val dateLabel = "Date Awarded"
        val dateValue = certificate.completionDate.ifBlank { "Not available yet" }
        drawStatColumn(canvas, dateLabel, dateValue, cardLeft + (cardRight - cardLeft) * 0.28f, y, slate800)
        drawStatColumn(canvas, "Credential ID", certificate.certificateNumber, cardLeft + (cardRight - cardLeft) * 0.72f, y, slate600)

        // Footer
        drawCenteredText(canvas, "SkillUp | Rupeek Learning Academy", centerX, HEIGHT - MARGIN, 20f, slate400)

        return bitmap
    }

    /** Decodes and draws one logo resource centered horizontally, scaled to
     * fit within [maxWidth]x[maxHeight] while preserving its aspect ratio
     * (never upscaled beyond native resolution). Returns the y just below it. */
    private fun drawLogo(canvas: Canvas, context: Context, resId: Int, top: Float, maxWidth: Float, maxHeight: Float): Float {
        val bmp = BitmapFactory.decodeResource(context.resources, resId) ?: return top
        val scale = minOf(maxWidth / bmp.width, maxHeight / bmp.height, 1f)
        val w = bmp.width * scale
        val h = bmp.height * scale
        val left = (WIDTH - w) / 2f
        canvas.drawBitmap(bmp, null, RectF(left, top, left + w, top + h), Paint(Paint.ANTI_ALIAS_FLAG or Paint.FILTER_BITMAP_FLAG))
        if (!bmp.isRecycled) bmp.recycle()
        return top + h
    }

    private fun drawStatColumn(canvas: Canvas, label: String, value: String, centerX: Float, top: Float, valueColor: Int) {
        drawCenteredText(canvas, label.uppercase(), centerX, top, 18f, slate400, bold = true, letterSpacing = 0.05f)
        drawCenteredText(canvas, value, centerX, top + 40f, 30f, valueColor, bold = true)
    }

    private fun drawCenteredText(
        canvas: Canvas,
        text: String,
        centerX: Float,
        top: Float,
        textSize: Float,
        color: Int,
        bold: Boolean = false,
        italic: Boolean = false,
        letterSpacing: Float = 0f
    ): Float {
        val paint = TextPaint(Paint.ANTI_ALIAS_FLAG).apply {
            this.textSize = textSize
            this.color = color
            this.textAlign = Paint.Align.CENTER
            this.isFakeBoldText = bold
            this.letterSpacing = letterSpacing
            if (italic) this.textSkewX = -0.2f
        }
        canvas.drawText(text, centerX, top + textSize, paint)
        return top + textSize + 12f
    }

    /** Wraps long text (long names/course titles) via StaticLayout so it
     * never overlaps or clips — grows the certificate's vertical flow
     * instead of truncating. */
    private fun drawWrappedCenteredText(
        canvas: Canvas,
        text: String,
        centerX: Float,
        top: Float,
        maxWidth: Float,
        textSize: Float,
        color: Int,
        bold: Boolean
    ): Float {
        val paint = TextPaint(Paint.ANTI_ALIAS_FLAG).apply {
            this.textSize = textSize
            this.color = color
            this.isFakeBoldText = bold
            this.textAlign = Paint.Align.LEFT
        }
        val layout = StaticLayout.Builder
            .obtain(text, 0, text.length, paint, maxWidth.toInt())
            .setAlignment(Layout.Alignment.ALIGN_CENTER)
            .setLineSpacing(0f, 1.05f)
            .build()

        canvas.save()
        canvas.translate(centerX - maxWidth / 2f, top)
        layout.draw(canvas)
        canvas.restore()

        return top + layout.height + 12f
    }
}
