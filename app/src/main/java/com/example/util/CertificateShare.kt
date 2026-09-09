package com.example.util

import android.content.Context
import android.content.Intent
import androidx.core.content.FileProvider
import com.example.data.model.Certificate
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.File
import java.io.FileOutputStream

/**
 * Generates the certificate as a standalone PNG (via [CertificateImageRenderer],
 * never a screenshot of the app UI) and hands it to the native Android share
 * sheet through a FileProvider content:// URI. No new backend/API involved —
 * this is a local render + local share only.
 */
object CertificateShare {

    suspend fun share(context: Context, certificate: Certificate) {
        val uri = withContext(Dispatchers.Default) {
            val bitmap = CertificateImageRenderer.render(context, certificate)
            val dir = File(context.cacheDir, "certificates").apply { mkdirs() }
            val file = File(dir, "certificate_${certificate.id}.png")
            FileOutputStream(file).use { out ->
                bitmap.compress(android.graphics.Bitmap.CompressFormat.PNG, 100, out)
            }
            bitmap.recycle()
            FileProvider.getUriForFile(context, "${context.packageName}.fileprovider", file)
        }

        val sendIntent = Intent(Intent.ACTION_SEND).apply {
            type = "image/png"
            putExtra(Intent.EXTRA_STREAM, uri)
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
        }
        context.startActivity(Intent.createChooser(sendIntent, "Share Certificate"))
    }
}
