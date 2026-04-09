# PokeVerse — Project Specification

## Mô tả dự án

PokeVerse là một ứng dụng web khám phá thế giới Pokémon, được xây dựng bằng **Angular (phiên bản mới nhất)** với mục đích minh họa và thực hành các pattern hiện đại của framework. Toàn bộ dữ liệu được lấy từ **PokéAPI** — một REST API công khai, miễn phí, không cần xác thực.

Ứng dụng bao gồm 8 màn hình chính, mỗi màn hình được thiết kế để khai thác một nhóm tính năng Angular cụ thể, đồng thời tạo thành một sản phẩm hoàn chỉnh và có tính năng thực tế.

---

## Nguồn dữ liệu

**PokéAPI** — `https://pokeapi.co/api/v2/`

- Hoàn toàn miễn phí, không cần API key, không cần đăng ký
- Rate limit: 100 requests/IP/phút (đủ cho mọi tình huống dùng thử)
- Hỗ trợ CORS, dùng trực tiếp từ browser
- Dữ liệu có sẵn: hơn 1.000 Pokémon, type, move, ability, evolution chain, generation, stat, sprite image

Các endpoint sử dụng:

| Endpoint | Dữ liệu trả về |
|---|---|
| `GET /pokemon?limit=20&offset=0` | Danh sách Pokémon (phân trang) |
| `GET /pokemon/{id or name}` | Chi tiết 1 Pokémon (stat, move, ability, type, sprite) |
| `GET /pokemon-species/{id}` | Mô tả, generation, evolution chain URL |
| `GET /evolution-chain/{id}` | Chuỗi tiến hóa dạng cây |
| `GET /type/{id or name}` | Danh sách Pokémon theo type, bảng điểm yếu/mạnh |
| `GET /generation/{id}` | Danh sách Pokémon theo thế hệ |
| `GET /move/{id or name}` | Chi tiết chiêu thức |
| `GET /ability/{id or name}` | Chi tiết năng lực đặc biệt |

---

## Thiết kế tính năng

---

### 1. Browse (Duyệt danh sách)

**Mục đích:** Điểm vào chính của app. Hiển thị toàn bộ Pokémon dưới dạng lưới card, hỗ trợ cuộn vô hạn.

**Luồng dữ liệu:**

- Gọi `GET /pokemon?limit=20&offset=N` mỗi khi người dùng cuộn gần cuối danh sách
- Offset tăng theo batch, dừng khi `next === null` trong response
- Mỗi item trong list chỉ có `name` và `url` → gọi thêm `GET /pokemon/{name}` để lấy sprite và type

**Đầu vào (Input):**

- Người dùng cuộn trang (trigger load thêm)
- Người dùng click vào card → điều hướng sang màn hình Detail

**Đầu ra (Output):**

- Lưới card hiển thị: ảnh sprite, tên, type badge (màu theo type)
- Trạng thái loading skeleton khi đang fetch
- Nút "Thêm vào Favorites" ngay trên card
- Nút "Thêm vào Team" ngay trên card (disable nếu team đã đủ 6)

---

### 2. Search & Filter (Tìm kiếm và lọc)

**Mục đích:** Cho phép người dùng tìm Pokémon theo tên, lọc theo type và generation.

**Luồng dữ liệu:**

- Tìm theo tên: gọi `GET /pokemon/{name}` khi người dùng nhập (có debounce 400ms), hiển thị kết quả gợi ý
- Lọc theo type: gọi `GET /type/{name}` → lấy danh sách `pokemon` trong response, giao với kết quả generation nếu có
- Lọc theo generation: gọi `GET /generation/{id}` → lấy `pokemon_species`, map sang danh sách Pokémon

**Đầu vào (Input):**

- Ô tìm kiếm văn bản (tên Pokémon)
- Dropdown hoặc chip multi-select chọn type (ví dụ: Fire, Water, Grass — tối đa 2 type, vì Pokémon chỉ có tối đa 2 type)
- Dropdown chọn generation (Gen I đến Gen IX)
- Nút Reset về trạng thái mặc định

**Đầu ra (Output):**

- Danh sách kết quả dạng lưới card (tái sử dụng card component từ Browse)
- Thông báo "Không tìm thấy" nếu không có kết quả
- Số lượng kết quả hiển thị ở đầu danh sách

---

### 3. Pokémon Detail (Chi tiết)

**Mục đích:** Hiển thị toàn bộ thông tin của một Pokémon.

**Luồng dữ liệu:**

- Nhận `id` hoặc `name` từ URL param
- Gọi song song:
  - `GET /pokemon/{id}` → stat, move, ability, type, sprite (kể cả sprite shiny)
  - `GET /pokemon-species/{id}` → mô tả Pokédex, evolution chain URL
- Sau khi có evolution chain URL → gọi thêm `GET /evolution-chain/{id}` → vẽ cây tiến hóa

**Đầu vào (Input):**

- URL param: `/pokemon/:id`
- Nút toggle giữa sprite thường và sprite shiny
- Nút click vào Pokémon trong cây tiến hóa → điều hướng sang detail của Pokémon đó

**Đầu ra (Output):**

- Ảnh sprite (thường / shiny)
- Type badge
- Chỉ số base stat (HP, Attack, Defense, Sp. Atk, Sp. Def, Speed) dạng thanh bar
- Danh sách ability (kèm tooltip mô tả khi hover)
- Danh sách move học được (tên, type, power, accuracy)
- Cây tiến hóa (Pokémon A → Pokémon B → Pokémon C, kèm điều kiện tiến hóa)
- Nút "Thêm vào Favorites" / "Thêm vào Team"

---

### 4. Compare (So sánh)

**Mục đích:** So sánh chỉ số base stat của 2 Pokémon cạnh nhau.

**Luồng dữ liệu:**

- Người dùng chọn 2 Pokémon qua ô search (tương tự Search & Filter, dùng lại logic debounce)
- Gọi `GET /pokemon/{name}` cho mỗi Pokémon được chọn
- So sánh từng chỉ số stat, highlight bên nào cao hơn

**Đầu vào (Input):**

- 2 ô search độc lập, mỗi ô autocomplete theo tên
- Nút "Hoán đổi" (swap 2 Pokémon)
- Nút "So sánh" để khóa lựa chọn và hiển thị bảng

**Đầu ra (Output):**

- 2 card Pokémon đặt cạnh nhau
- Bảng so sánh từng stat: thanh bar đôi, stat cao hơn được highlight
- Tổng base stat của mỗi bên
- Danh sách type và điểm mạnh/yếu của từng bên
- Nút "Thêm vào Team" cho từng Pokémon

---

### 5. Team Builder (Xây dựng đội)

**Mục đích:** Cho phép người dùng lắp ráp đội hình 6 Pokémon bằng thao tác kéo thả.

**Luồng dữ liệu:**

- Dữ liệu đội hình được lưu trong bộ nhớ ứng dụng (không cần API thêm, dùng dữ liệu đã fetch ở các màn hình khác)
- Khi thêm Pokémon mới vào đội từ màn hình khác, dữ liệu được ghi vào state toàn cục
- Phân tích type coverage: tính tổng hợp điểm mạnh/yếu của cả đội dựa trên bảng type từ `GET /type/{name}`

**Đầu vào (Input):**

- 6 slot thả (drop zone), kéo Pokémon từ danh sách bên cạnh vào
- Danh sách Pokémon nguồn: lấy từ Favorites hoặc tìm kiếm nhanh
- Kéo để sắp xếp lại thứ tự trong 6 slot
- Nút xóa Pokémon khỏi slot
- Nút "Xóa cả đội"

**Đầu ra (Output):**

- 6 slot hiển thị sprite, tên, type
- Phân tích type coverage: type nào đội đang mạnh, type nào đang yếu
- Nút "Lưu đội" → ghi tên đội và lưu vào localStorage

---

### 6. Favorites (Yêu thích)

**Mục đích:** Xem và quản lý danh sách Pokémon đã đánh dấu yêu thích.

**Luồng dữ liệu:**

- Danh sách ID yêu thích được lưu vào **localStorage** và đồng bộ vào state toàn cục khi app khởi động
- Không cần gọi API thêm nếu dữ liệu đã được cache từ lần xem trước; gọi lại `GET /pokemon/{id}` nếu chưa có trong cache

**Đầu vào (Input):**

- Nút "Bỏ yêu thích" trên từng card
- Nút "Xóa tất cả"
- Click vào card → điều hướng sang Detail

**Đầu ra (Output):**

- Lưới card tương tự Browse (tái sử dụng component)
- Thông báo rỗng nếu chưa có Pokémon yêu thích
- Số lượng Pokémon trong danh sách

---

### 7. Trainer Profile (Hồ sơ Trainer)

**Mục đích:** Cho phép người dùng tạo và chỉnh sửa hồ sơ cá nhân của mình với vai trò một Trainer Pokémon. Màn hình này dùng **template-driven form**.

**Luồng dữ liệu:**

- Dữ liệu profile được lưu vào **localStorage**
- Không có API call — toàn bộ dữ liệu do người dùng nhập
- Ảnh avatar: người dùng nhập URL hoặc chọn từ danh sách avatar có sẵn (lấy sprite của một Pokémon làm avatar)

**Đầu vào (Input — các field của form):**

| Field | Loại | Validation |
|---|---|---|
| Tên Trainer | Text input | Bắt buộc, 3–20 ký tự |
| Slogan | Text input | Tùy chọn, tối đa 60 ký tự |
| Khu vực yêu thích | Dropdown | Bắt buộc (Kanto, Johto, Hoenn, Sinnoh, ...) |
| Type yêu thích | Dropdown | Bắt buộc |
| Avatar URL | Text input | Tùy chọn, kiểm tra định dạng URL |
| Liên kết mạng xã hội | Nhóm field (Twitter, GitHub) | Tùy chọn, kiểm tra định dạng URL |
| Giới thiệu bản thân | Textarea | Tùy chọn, tối đa 200 ký tự |

**Đầu ra (Output):**

- Lưu profile vào localStorage khi submit thành công
- Hiển thị thông báo thành công
- Card preview profile cập nhật real-time khi người dùng nhập
- Hiển thị lỗi validation ngay dưới từng field khi field bị "touched"

---

### 8. Pokémon Builder (Tạo Pokémon tùy chỉnh)

**Mục đích:** Cho phép người dùng tạo một Pokémon do mình thiết kế (fan-made). Màn hình này dùng **reactive form** với đầy đủ tính năng nâng cao, được chia thành 4 bước (wizard).

**Luồng dữ liệu:**

- Bước 1–3: chỉ có dữ liệu người dùng nhập, không gọi API
- Async validation tên: gọi `GET /pokemon/{name}` để kiểm tra tên đã tồn tại trong PokéAPI hay chưa (nếu đã tồn tại → báo lỗi "tên đã được dùng")
- Danh sách type và move để chọn: lấy từ `GET /type` và `GET /move?limit=50` (preload khi vào trang)
- Kết quả cuối: lưu vào localStorage, không gửi lên server

#### Bước 1 — Thông tin cơ bản

**Đầu vào:**

| Field | Loại | Validation |
|---|---|---|
| Tên Pokémon | Text input | Bắt buộc, 3–20 ký tự, không chứa số; async: kiểm tra không trùng tên trong PokéAPI |
| Type chính | Dropdown | Bắt buộc |
| Type phụ | Dropdown | Tùy chọn, phải khác type chính |
| Mô tả Pokédex | Textarea | Bắt buộc, 20–200 ký tự |
| Generation | Dropdown | Bắt buộc |

#### Bước 2 — Chỉ số Base Stat

**Đầu vào:**

- 6 slider tùy chỉnh (HP, Attack, Defense, Sp. Atk, Sp. Def, Speed), mỗi slider nhận giá trị 1–255
- Tổng 6 chỉ số phải ≤ 600 (custom validator ở cấp FormGroup)
- Nếu vượt quá 600: hiển thị lỗi và highlight các stat đang "vượt ngưỡng"

**Đầu ra (preview real-time):**

- Thanh bar stat cập nhật ngay khi kéo slider
- Hiển thị tổng điểm hiện tại / 600

#### Bước 3 — Move (Chiêu thức)

**Đầu vào:**

- FormArray chứa các move slot (tối thiểu 1, tối đa 4)
- Mỗi slot: dropdown chọn move từ danh sách `GET /move?limit=50` (có search)
- Nút "Thêm move" (disable khi đã đủ 4)
- Nút "Xóa" trên từng slot
- Validation: không được chọn trùng move trong cùng một Pokémon

#### Bước 4 — Preview & Lưu

**Đầu ra:**

- Hiển thị toàn bộ thông tin đã nhập: tên, type, stat bar, move list, mô tả
- Dùng sprite của một Pokémon random cùng type làm placeholder ảnh
- Nút "Quay lại chỉnh sửa" (điều hướng về bước bất kỳ)
- Nút "Lưu Pokémon" → ghi vào localStorage, điều hướng sang trang "My Pokémon" (subset của Favorites)

---

## Trạng thái toàn cục (Global State)

Các dữ liệu sau được chia sẻ giữa các màn hình và cần được quản lý ở cấp app:

| State | Kiểu | Khởi tạo từ | Được dùng ở |
|---|---|---|---|
| Danh sách Pokémon yêu thích | `number[]` (ID) | localStorage | Browse, Detail, Favorites, Team Builder |
| Đội hình hiện tại | `Pokemon[6]` | localStorage | Browse, Detail, Team Builder |
| Pokémon tùy chỉnh đã tạo | `CustomPokemon[]` | localStorage | Pokémon Builder, Favorites |
| Trainer profile | `TrainerProfile` | localStorage | Trainer Profile, header |
| Cache Pokémon đã fetch | `Map<id, Pokemon>` | bộ nhớ (session) | Tất cả các màn hình |

---

## Điều hướng (Routes)

| Path | Màn hình |
|---|---|
| `/` | Browse |
| `/search` | Search & Filter |
| `/pokemon/:id` | Pokémon Detail |
| `/compare` | Compare |
| `/team` | Team Builder |
| `/favorites` | Favorites |
| `/profile` | Trainer Profile |
| `/builder` | Pokémon Builder |
