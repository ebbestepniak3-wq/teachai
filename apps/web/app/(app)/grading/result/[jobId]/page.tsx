// app/(app)/grading/result/[jobId]/page.tsx – Phase 5
import { Metadata } from 'next'
import { getServerUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect, notFound } from 'next/navigation'
import { GradingResultView } from '@/components/grading/result-view'
import { GradingPending } from '@/components/grading/grading-pending'

export const metadata: Metadata = { title: 'Bewertungsergebnis' }

export default async function GradingResultPage({ params }: { params: { jobId: string } }) {
  const jwtUser = await getServerUser()
  if (!jwtUser) redirect('/login')

  const job = await prisma.gradingJob.findFirst({
    where: { id: params.jobId, userId: jwtUser.sub },
    include: {
      upload: { select: { fileName: true, fileType: true, pageCount: true, storageKey: true } },
      report: true,
    },
  })

  if (!job) notFound()

  if (job.status === 'QUEUED' || job.status === 'PROCESSING') {
    return (
      <GradingPending
        jobId={job.id}
        fach={job.fach}
        klassenstufe={job.klassenstufe}
        fileName={job.upload?.fileName || 'Datei'}
      />
    )
  }

  if (job.status === 'FAILED') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="text-6xl mb-6">❌</div>
        <h1 className="text-2xl font-bold">Bewertung fehlgeschlagen</h1>
        <p className="mt-3 text-muted-foreground max-w-md">
          {job.errorMessage || 'Die KI-Bewertung ist fehlgeschlagen. Bitte versuchen Sie es erneut.'}
        </p>
        <a href="/upload" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground">
          Erneut versuchen
        </a>
      </div>
    )
  }

  if (!job.report) notFound()

  const { getSignedDownloadUrl } = await import('@/lib/storage/supabase')
  const previewUrl = job.upload?.storageKey
    ? await getSignedDownloadUrl(job.upload.storageKey, 3600)
    : null

  return (
    <GradingResultView
      jobId={job.id}
      reportId={job.report.id}
      fach={job.fach}
      schulform={job.schulform}
      klassenstufe={job.klassenstufe}
      bundesland={job.bundesland}
      aufgabentyp={job.aufgabentyp}
      fileName={job.upload?.fileName || ''}
      fileType={job.upload?.fileType || ''}
      pageCount={job.upload?.pageCount || 1}
      previewUrl={previewUrl}
      report={{
        id: job.report.id,
        gesamtpunkte: job.report.gesamtpunkte,
        maximalpunkte: job.report.maximalpunkte,
        note: job.report.note,
        punkteVerteilung: job.report.punkteVerteilung as any,
        feedback: job.report.feedback,
        staerken: job.report.staerken as string[],
        schwaechen: job.report.schwaechen as string[],
        verbesserungsvorschlaege: job.report.verbesserungsvorschlaege as string[],
        zusammenfassung: job.report.zusammenfassung,
        lehrerAnmerkungen: job.report.lehrerAnmerkungen,
        finalisiertVon: job.report.finalisiertVon,
        pdfStorageKey: job.report.pdfStorageKey,
      }}
    />
  )
}
