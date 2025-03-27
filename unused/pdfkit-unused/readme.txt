Experimented with writing to PDF. Leaving out of application but keeping for potential later use.

Issues:
    * No built-in table support, the table lib I found was partially broken, so I had to import it into locally and fix some issues, which brought about needing to make local copies of these files.
    * Almost doubles the size of the built web app (might be smaller but we don't use optimized outputs yet due to issues with inline scripts). Size increased from ~2.9MB to ~5.4MB.

Commented out example exists in DataUtils.ts, look for exportDataToPdf. If desired to use again, make sure to npm install blob-stream.