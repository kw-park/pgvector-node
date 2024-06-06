-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector" WITH SCHEMA "public";

-- CreateTable
CREATE TABLE "FaceEmbedding" (
    "id" SERIAL NOT NULL,
    "personId" INTEGER NOT NULL,
    "embedding" vector NOT NULL,

    CONSTRAINT "FaceEmbedding_pkey" PRIMARY KEY ("id")
);
