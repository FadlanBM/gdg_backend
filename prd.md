Berikut PRD + prompt engineering yang lebih terstruktur agar AI (dengan LangChain + multi-image analysis) bisa memahami kebutuhanmu secara presisi dan mengurangi ambiguity.

## PRD (Product Requirement Document)

### Feature Name

**AI Product Price Analyzer (Multi Image Support)**

### Objective

Menambahkan kemampuan pada endpoint `/products/analyze-price` untuk menerima **multiple product images** dan menganalisa menggunakan **AI + LangChain** agar dapat:

1. Menentukan **estimasi harga jual produk**
2. Menilai **kualitas produk/buah** dari foto
3. Memberikan **confidence score**
4. Menjelaskan **alasan penentuan harga**
5. Mendeteksi **kondisi visual** produk berdasarkan multi-image

---

## Business Goal

Membantu seller menentukan harga jual produk secara otomatis berdasarkan:

* kualitas visual
* kondisi fisik
* ukuran relatif
* tingkat kematangan (khusus buah)
* cacat visual
* warna
* konsistensi bentuk
* market reference (opsional)

---

## Endpoint

### Existing

`POST /products/analyze-price`

### Enhancement

Endpoint harus mendukung:

* `multipart/form-data`
* multiple images upload
* AI image analysis via LangChain

---

## Functional Requirements

### Input Parameters

#### Request Body

```ts
multipart/form-data
```

| Field             | Type   | Required | Description         |
| ----------------- | ------ | -------- | ------------------- |
| images            | File[] | Yes      | Multi image product |
| productName       | string | No       | Nama produk         |
| category          | string | No       | Kategori produk     |
| location          | string | No       | Lokasi market       |
| currency          | string | No       | Default IDR         |
| additionalContext | string | No       | Informasi tambahan  |

### Example Request

```http
POST /products/analyze-price
Content-Type: multipart/form-data
```

Form Data:

```json
{
  "images": [
    "front.jpg",
    "left.jpg",
    "right.jpg",
    "top.jpg"
  ],
  "productName": "Mangga Harum Manis",
  "category": "fruit",
  "location": "Yogyakarta",
  "currency": "IDR"
}
```

---

## AI Analysis Requirements

### Multi Image Processing

AI harus menganalisa **semua gambar secara agregat**, bukan satu-persatu saja.

Contoh:

* image depan → warna
* image samping → ukuran
* image close-up → cacat
* image atas → bentuk

Lalu menghasilkan satu kesimpulan final.

---

### Fruit Quality Assessment

Jika kategori adalah buah:

AI harus menilai:

#### Visual Quality

* warna
* tingkat kematangan
* ukuran
* tekstur kulit
* cacat fisik
* memar
* busuk
* jamur
* konsistensi bentuk

#### Quality Grade

Contoh grading:

```ts
A = premium
B = good
C = standard
D = poor
Reject = not sellable
```

---

### Price Estimation Logic

AI menentukan harga berdasarkan:

```text
quality score
+
visual condition
+
estimated freshness
+
market category
+
product type
```

Opsional:

Tambahkan market lookup untuk harga lokal.

Misal:

```text
Mangga Grade A Jogja
≈ Rp25.000/kg
```

---

## Expected Response

### Success Response

```json
{
  "success": true,
  "data": {
    "productDetected": "Mangga Harum Manis",
    "estimatedPrice": {
      "min": 22000,
      "max": 28000,
      "currency": "IDR"
    },
    "quality": {
      "grade": "A",
      "score": 91,
      "freshness": "High",
      "ripeness": "Ripe",
      "condition": "Very Good"
    },
    "visualAnalysis": {
      "color": "Yellow-Green",
      "surfaceCondition": "Minor spots",
      "shapeConsistency": "Good",
      "damageDetected": false,
      "moldDetected": false
    },
    "confidenceScore": 0.89,
    "reasoning": [
      "Fruit color indicates mature ripeness",
      "No significant bruises detected",
      "Uniform shape increases market value",
      "Surface quality suitable for premium category"
    ],
    "recommendation": {
      "sellingCategory": "Premium",
      "recommendedPrice": 25000
    }
  }
}
```

---

## Non Functional Requirements

### Performance

* Response max 15–20 seconds
* Async processing recommended

### Image Validation

Allowed:

```ts
jpg
jpeg
png
webp
```

Max:

```ts
10 images
```

Max size:

```ts
10MB/image
```

---

## Suggested Architecture (LangChain)

### Flow

```text
Upload Images
        ↓
Image Preprocessing
        ↓
LangChain Vision Model
        ↓
Multi-image Aggregation
        ↓
Quality Detection
        ↓
Price Estimation
        ↓
Structured JSON Response
```

### Recommended Stack

#### Vision Model

* GPT-4o Vision
* Claude Vision
* Gemini 2.5 Pro Vision

#### LangChain

Gunakan:

```ts
RunnableSequence
```

atau

```ts
Agent + Structured Output Parser
```

Supaya output JSON konsisten.

---

## Prompt untuk AI (Production Ready)

Gunakan prompt ini di LangChain:

```text
You are an expert agricultural and product quality analyst.

Your task is to analyze MULTIPLE product images together and determine:

1. Product identification
2. Product quality
3. Fruit quality grade (if applicable)
4. Estimated selling price
5. Product condition
6. Freshness level
7. Ripeness level (for fruits)
8. Damage detection
9. Final recommendation

IMPORTANT RULES:

- Analyze ALL images collectively.
- Do not analyze only one image.
- Combine information from every image before making conclusions.
- Prioritize visible condition, defects, freshness, color, size, and market quality.
- If the product is fruit, provide fruit quality grading.
- Return ONLY valid JSON.
- Include confidence score.
- Be conservative if uncertain.

Output schema:

{
  "productDetected": "string",
  "estimatedPrice": {
    "min": number,
    "max": number,
    "currency": "IDR"
  },
  "quality": {
    "grade": "A|B|C|D|Reject",
    "score": number,
    "freshness": "Low|Medium|High",
    "ripeness": "Unripe|Semi-ripe|Ripe|Overripe",
    "condition": "Poor|Fair|Good|Very Good|Excellent"
  },
  "visualAnalysis": {
    "color": "string",
    "surfaceCondition": "string",
    "shapeConsistency": "string",
    "damageDetected": boolean,
    "moldDetected": boolean
  },
  "confidenceScore": number,
  "reasoning": [
    "string"
  ],
  "recommendation": {
    "sellingCategory": "Budget|Standard|Premium",
    "recommendedPrice": number
  }
}
```
