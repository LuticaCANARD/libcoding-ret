---
applyTo: '**'
---
# 멘토-멘티 매칭 앱 개발 요구사항

## 앱 개요

이 앱은 **멘토와 멘티를 서로 매칭하는 시스템**입니다. 멘토는 자신의 기술 스택과 소개를 등록하고, 멘티는 원하는 멘토에게 매칭 요청을 보낼 수 있습니다. 멘토는 매칭 요청을 수락하거나 거절할 수 있으며, 한 명의 멘토는 동시에 한 명의 멘티와만 매칭할 수 있습니다.

## 앱 개발 공통 요구사항

- 제한시간: 3시간
- 사용 도구: VS Code + GitHub Copilot 보이스 코딩
- 기술 스택: 웹 앱
- 사용 언어: Python, JavaScript, Java, .NET 중 선택
- 데이터베이스: 자유 선택 (단, 로컬에서 돌아갈 수 있어야 함)

## 기능 요구사항

### 1. 회원가입 및 로그인

- 사용자는 이메일, 비밀번호, 역할(멘토 또는 멘티)을 입력해 회원가입할 수 있어야 합니다.
- 회원가입한 사용자는 로그인할 수 있어야 합니다.
- 로그인 후에는 JWT 형식의 인증토큰을 발급 받습니다. 이 인증 토큰을 이용해 백엔드 API와 통신해야 합니다.

### 2. 사용자 프로필

- 사용자는 로그인 후 자신의 프로필을 등록하거나 수정할 수 있어야 합니다.
  - 멘토: 이름, 소개글, 프로필 이미지, 기술 스택
  - 멘티: 이름, 소개글, 프로필 이미지
- 로그인한 사용자는 자신의 정보를 조회할 수 있어야 합니다.
- 프로필 이미지는 수정하지 않은 경우 기본 이미지를 보여줘야 합니다.
- 프로필 이미지는 로컬 컴퓨터의 이미지 파일을 업로드해서 수정할 수 있습니다.

### 3. 멘토 목록 조회

- 멘티는 멘토의 리스트를 볼 수 있어야 합니다.
- 검색 필터(예: 기술 스택으로 필터링)를 통해 특정 기술 스택을 가진 멘토만 검색할 수 있어야 합니다.
- 멘토 이름 또는 기술 스택으로 멘토 리스트를 정렬할 수 있어야 합니다.

### 4. 매칭 요청 기능

- 멘티는 원하는 멘토에게 매칭 요청을 보낼 수 있어야 합니다.
- 한 멘토에게 한 번만 요청할 수 있으며, 멘토가 수락하거나 거절하기 전까지 다른 멘토에게 중복 요청은 불가능합니다.
- 요청에는 간단한 메시지를 포함할 수 있습니다.

### 5. 요청 수락/거절

- 멘토는 받은 매칭 요청 목록을 볼 수 있어야 하며, 요청을 **수락** 또는 **거절**할 수 있어야 합니다.
- 멘토는 **한 명의 멘티 요청만 수락**할 수 있으며, 수락한 후에는 해당 요청을 취소하거나 삭제하기 전까지 다른 요청을 수락할 수 없습니다.
- 수락하거나 거절한 요청은 상태값을 변경할 수 있어야 합니다.

### 6. 요청 목록 조회

- 멘티는 자신이 보낸 매칭 요청과 그 상태(대기중, 수락, 거절)를 확인할 수 있어야 합니다.
- 멘티는 본인이 보낸 매칭 요청을 **삭제(취소)**할 수 있어야 합니다.

## 기술 요구사항

### 1. 앱 공통 요구사항

앱을 실행시키면 아래와 같은 URL로 접속할 수 있어야 합니다.

- 프론트엔드 앱 URL: http://localhost:3000
- 백엔드 앱 URL: http://localhost:8080
- 백엔드 API 엔드포인트 URL: http://localhost:8080/api

### 2. OpenAPI 설계 우선 원칙

- API 명세에 정의한 대로 작성한 OpenAPI 문서를 제공합니다.
- 제공하는 OpenAPI 문서를 바탕으로 프론트엔드 UI 앱과 백엔드 API 앱을 구현해야 합니다.
 
### 3. JWT 클레임

- [RFC 7519](https://datatracker.ietf.org/doc/html/rfc7519#section-4.1)에서 정의한 `iss`, `sub`, `aud`, `exp`, `nbf`, `iat`, `jti` 클레임을 형식에 맞게 모두 추가해야 합니다.
- `name`, `email`, `role` 클레임을 반드시 포함해야 합니다. 이 때 `role` 클레임의 값은 `mentor` 또는 `mentee`입니다.
- `exp` 클레임은 발급 시각 기준 1시간의 유효기간을 갖습니다.

### 4. 프로필 이미지

- 프로필 이미지는 `.jpg` 또는 `.png` 형식만 허용합니다.
- 프로필 이미지는 정사각형 모양으로 최소 `500x500` 픽셀, 최대 `1000x1000` 픽셀입니다.
- 프로필 이미지의 크기는 최대 1MB입니다.
- 기본 프로필 이미지는 아래 플레이스홀더 이미지를 사용합니다.
  - 멘토: `https://placehold.co/500x500.jpg?text=MENTOR`
  - 멘티: `https://placehold.co/500x500.jpg?text=MENTEE`

### 5. 데이터베이스

- 데이터베이스의 종류는 자유롭게 선택할 수 있습니다.
- 최초 앱 실행시 데이터베이스를 초기화하고 필요한 테이블을 구성할 수 있어야 합니다.
- 멘토와 멘티는 같은 테이블을 사용합니다.
- 프로필 이미지도 데이터베이스에 저장합니다.

### 6. 백엔드 API

- 백엔드 API는 OpenAPI 문서를 자동으로 렌더링할 수 있는 링크를 제공해야 합니다. (예: `http://localhost:8080/openapi.json`)
- 백엔드 API는 Swagger UI 페이지를 렌더링할 수 있는 링크를 제공해야 합니다. (예: `http://localhost:8080/swagger-ui`)
- Swagger UI를 통해 OpenAPI 문서 페이지로 이동할 수 있어야 합니다.
- 백엔드 API URL인 `http://localhost:8080`으로 접속하면 자동으로 Swagger UI 화면으로 이동해야 합니다.

### 7. 보안

- 로컬 HTTPS 인증서는 사용하지 않습니다.
  - 즉, 로컬에서 `http://localhost:3000` 또는 `http://localhost:8080`으로 접속할 수 있으면 충분합니다.
- SQL 인젝션 공격에 대비해야 합니다.
- XSS 공격에 대비해야 합니다.
- OWASP TOP 10 취약점에 대비해야 합니다.

# OpenAPI 문서
```yaml
openapi: 3.0.1
info:
  title: Mentor-Mentee Matching API
  description: API for matching mentors and mentees in a mentoring platform
  version: 1.0.0
  contact:
    name: Mentor-Mentee Matching App
  license:
    name: MIT

servers:
  - url: http://localhost:8080/api
    description: Local development server

security:
  - BearerAuth: []

paths:
  /signup:
    post:
      operationId: signup
      tags:
        - Authentication
      summary: User registration
      description: Register a new user as either a mentor or mentee
      security: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/SignupRequest'
      responses:
        '201':
          description: User successfully created
        '400':
          description: Bad request - invalid payload format
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
        '500':
          description: Internal server error
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'

  /login:
    post:
      operationId: login
      tags:
        - Authentication
      summary: User login
      description: Authenticate user and return JWT token
      security: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/LoginRequest'
      responses:
        '200':
          description: Login successful
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/LoginResponse'
        '400':
          description: Bad request - invalid payload format
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
        '401':
          description: Unauthorized - login failed
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
        '500':
          description: Internal server error
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'

  /me:
    get:
      operationId: getCurrentUser
      tags:
        - User Profile
      summary: Get current user information
      description: Retrieve the profile information of the currently authenticated user
      responses:
        '200':
          description: User information retrieved successfully
          content:
            application/json:
              schema:
                oneOf:
                  - $ref: '#/components/schemas/MentorProfile'
                  - $ref: '#/components/schemas/MenteeProfile'
        '401':
          description: Unauthorized - authentication failed
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
        '500':
          description: Internal server error
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'

  /profile:
    put:
      operationId: updateProfile
      tags:
        - User Profile
      summary: Update user profile
      description: Update the profile information of the currently authenticated user
      requestBody:
        required: true
        content:
          application/json:
            schema:
              oneOf:
                - $ref: '#/components/schemas/UpdateMentorProfileRequest'
                - $ref: '#/components/schemas/UpdateMenteeProfileRequest'
      responses:
        '200':
          description: Profile updated successfully
          content:
            application/json:
              schema:
                oneOf:
                  - $ref: '#/components/schemas/MentorProfile'
                  - $ref: '#/components/schemas/MenteeProfile'
        '400':
          description: Bad request - invalid payload format
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
        '401':
          description: Unauthorized - authentication failed
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
        '500':
          description: Internal server error
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'

  /images/{role}/{id}:
    get:
      operationId: getProfileImage
      tags:
        - User Profile
      summary: Get profile image
      description: Retrieve the profile image for a specific user
      parameters:
        - name: role
          in: path
          required: true
          schema:
            type: string
            enum: [mentor, mentee]
          description: User role (mentor or mentee)
        - name: id
          in: path
          required: true
          schema:
            type: integer
          description: User ID
      responses:
        '200':
          description: Profile image retrieved successfully
          content:
            image/jpeg:
              schema:
                type: string
                format: binary
            image/png:
              schema:
                type: string
                format: binary
        '401':
          description: Unauthorized - authentication failed
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
        '500':
          description: Internal server error
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'

  /mentors:
    get:
      operationId: getMentors
      tags:
        - Mentors
      summary: Get list of mentors (mentee only)
      description: Retrieve a list of all mentors, with optional filtering and sorting
      parameters:
        - name: skill
          in: query
          required: false
          schema:
            type: string
          description: Filter mentors by skill set (only one skill at a time)
        - name: orderBy
          in: query
          required: false
          schema:
            type: string
            enum: [skill, name]
          description: Sort mentors by skill or name (ascending order)
      responses:
        '200':
          description: Mentor list retrieved successfully
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/MentorListItem'
        '401':
          description: Unauthorized - authentication failed
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
        '500':
          description: Internal server error
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'

  /match-requests:
    post:
      operationId: createMatchRequest
      tags:
        - Match Requests
      summary: Send match request (mentee only)
      description: Send a matching request to a mentor
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/MatchRequestCreate'
      responses:
        '200':
          description: Match request sent successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/MatchRequest'
        '400':
          description: Bad request - invalid payload or mentor not found
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
        '401':
          description: Unauthorized - authentication failed
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
        '500':
          description: Internal server error
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'

  /match-requests/incoming:
    get:
      operationId: getIncomingMatchRequests
      tags:
        - Match Requests
      summary: Get incoming match requests (mentor only)
      description: Retrieve all match requests received by the mentor
      responses:
        '200':
          description: Incoming match requests retrieved successfully
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/MatchRequest'
        '401':
          description: Unauthorized - authentication failed
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
        '500':
          description: Internal server error
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'

  /match-requests/outgoing:
    get:
      operationId: getOutgoingMatchRequests
      tags:
        - Match Requests
      summary: Get outgoing match requests (mentee only)
      description: Retrieve all match requests sent by the mentee
      responses:
        '200':
          description: Outgoing match requests retrieved successfully
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/MatchRequestOutgoing'
        '401':
          description: Unauthorized - authentication failed
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
        '500':
          description: Internal server error
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'

  /match-requests/{id}/accept:
    put:
      operationId: acceptMatchRequest
      tags:
        - Match Requests
      summary: Accept match request (mentor only)
      description: Accept a specific match request
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: integer
          description: Match request ID
      responses:
        '200':
          description: Match request accepted successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/MatchRequest'
        '404':
          description: Match request not found
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
        '401':
          description: Unauthorized - authentication failed
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
        '500':
          description: Internal server error
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'

  /match-requests/{id}/reject:
    put:
      operationId: rejectMatchRequest
      tags:
        - Match Requests
      summary: Reject match request (mentor only)
      description: Reject a specific match request
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: integer
          description: Match request ID
      responses:
        '200':
          description: Match request rejected successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/MatchRequest'
        '404':
          description: Match request not found
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
        '401':
          description: Unauthorized - authentication failed
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
        '500':
          description: Internal server error
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'

  /match-requests/{id}:
    delete:
      operationId: cancelMatchRequest
      tags:
        - Match Requests
      summary: Cancel match request (mentee only)
      description: Cancel/delete a specific match request
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: integer
          description: Match request ID
      responses:
        '200':
          description: Match request cancelled successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/MatchRequest'
        '404':
          description: Match request not found
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
        '401':
          description: Unauthorized - authentication failed
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
        '500':
          description: Internal server error
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'

components:
  securitySchemes:
    BearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
      description: JWT token obtained from login endpoint

  schemas:
    SignupRequest:
      type: object
      required:
        - email
        - password
        - name
        - role
      properties:
        email:
          type: string
          format: email
          example: "user@example.com"
        password:
          type: string
          minLength: 6
          example: "password123"
        name:
          type: string
          example: "김멘토"
        role:
          type: string
          enum: [mentor, mentee]
          example: "mentor"

    LoginRequest:
      type: object
      required:
        - email
        - password
      properties:
        email:
          type: string
          format: email
          example: "user@example.com"
        password:
          type: string
          example: "password123"

    LoginResponse:
      type: object
      required:
        - token
      properties:
        token:
          type: string
          example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

    MentorProfile:
      type: object
      required:
        - id
        - email
        - role
        - profile
      properties:
        id:
          type: integer
          example: 1
        email:
          type: string
          format: email
          example: "user@example.com"
        role:
          type: string
          enum: [mentor]
          example: "mentor"
        profile:
          $ref: '#/components/schemas/MentorProfileDetails'

    MenteeProfile:
      type: object
      required:
        - id
        - email
        - role
        - profile
      properties:
        id:
          type: integer
          example: 10
        email:
          type: string
          format: email
          example: "user@example.com"
        role:
          type: string
          enum: [mentee]
          example: "mentee"
        profile:
          $ref: '#/components/schemas/MenteeProfileDetails'

    MentorProfileDetails:
      type: object
      required:
        - name
        - bio
        - imageUrl
        - skills
      properties:
        name:
          type: string
          example: "Alice"
        bio:
          type: string
          example: "Frontend mentor"
        imageUrl:
          type: string
          example: "/images/mentor/1"
        skills:
          type: array
          items:
            type: string
          example: ["React", "Vue"]

    MenteeProfileDetails:
      type: object
      required:
        - name
        - bio
        - imageUrl
      properties:
        name:
          type: string
          example: "Alice"
        bio:
          type: string
          example: "Frontend mentee"
        imageUrl:
          type: string
          example: "/images/mentee/10"

    UpdateMentorProfileRequest:
      type: object
      required:
        - id
        - name
        - role
        - bio
        - image
        - skills
      properties:
        id:
          type: integer
          example: 1
        name:
          type: string
          example: "Alice"
        role:
          type: string
          enum: [mentor]
          example: "mentor"
        bio:
          type: string
          example: "Frontend mentor"
        image:
          type: string
          format: byte
          description: "Base64 encoded image string"
        skills:
          type: array
          items:
            type: string
          example: ["React", "Vue"]

    UpdateMenteeProfileRequest:
      type: object
      required:
        - id
        - name
        - role
        - bio
        - image
      properties:
        id:
          type: integer
          example: 21
        name:
          type: string
          example: "Alice"
        role:
          type: string
          enum: [mentee]
          example: "mentee"
        bio:
          type: string
          example: "Frontend mentee"
        image:
          type: string
          format: byte
          description: "Base64 encoded image string"

    MentorListItem:
      type: object
      required:
        - id
        - email
        - role
        - profile
      properties:
        id:
          type: integer
          example: 3
        email:
          type: string
          format: email
          example: "user@example.com"
        role:
          type: string
          enum: [mentor]
          example: "mentor"
        profile:
          $ref: '#/components/schemas/MentorProfileDetails'

    MatchRequestCreate:
      type: object
      required:
        - mentorId
        - menteeId
        - message
      properties:
        mentorId:
          type: integer
          example: 3
        menteeId:
          type: integer
          example: 4
        message:
          type: string
          example: "멘토링 받고 싶어요!"

    MatchRequest:
      type: object
      required:
        - id
        - mentorId
        - menteeId
        - message
        - status
      properties:
        id:
          type: integer
          example: 1
        mentorId:
          type: integer
          example: 3
        menteeId:
          type: integer
          example: 4
        message:
          type: string
          example: "멘토링 받고 싶어요!"
        status:
          type: string
          enum: [pending, accepted, rejected, cancelled]
          example: "pending"

    MatchRequestOutgoing:
      type: object
      required:
        - id
        - mentorId
        - menteeId
        - status
      properties:
        id:
          type: integer
          example: 11
        mentorId:
          type: integer
          example: 1
        menteeId:
          type: integer
          example: 10
        status:
          type: string
          enum: [pending, accepted, rejected, cancelled]
          example: "pending"

    ErrorResponse:
      type: object
      required:
        - error
      properties:
        error:
          type: string
          example: "Error message"
        details:
          type: string
          example: "Detailed error information"

tags:
  - name: Authentication
    description: User authentication endpoints
  - name: User Profile
    description: User profile management endpoints
  - name: Mentors
    description: Mentor listing endpoints
  - name: Match Requests
    description: Match request management endpoints

```

# 사용자 스토리

# 멘토-멘티 매칭 앱 사용자 스토리

## 앱 개요

이 앱은 **멘토와 멘티를 서로 매칭하는 시스템**입니다. 멘토는 자신의 기술 스택과 소개를 등록하고, 멘티는 원하는 멘토에게 매칭 요청을 보낼 수 있습니다. 멘토는 매칭 요청을 수락하거나 거절할 수 있으며, 한 명의 멘토는 동시에 한 명의 멘티와만 매칭할 수 있습니다.

## 기능

### 1. 회원가입

```text
AS a user,
I WANT to navigate to the `/signup` page
SO THAT I can sign up the service.
```

```text
AS a user,
I WANT to create an account using my email address, password and role (either mentor or mentee)
SO THAT I can sign up the service.
```

```text
AS a user,
I WANT to be redirected to the `/` page after completing the sign-up process
SO THAT I can log-in to the service.
```

### 2. 로그인

```text
AS a user,
I WANT to navigate to the `/` page
SO THAT I can be automatically redirected to the `/login` page, if I'm not authenticated.
```

```text
AS a user,
I WANT to navigate to the `/` page
SO THAT I can be automatically redirected to the `/profile` page, if I'm authenticated.
```

```text
AS a user,
I WANT to navigate to the `/login` page
SO THAT I can log-in to the service.
```

```text
AS a user
I WANT to log-in to the service using my email address and password
SO THAT I can be redirected to the `/profile` page.
```

```text
AS a user
I WANT to log-in to the service using my email address and password
SO THAT I can receive a JWT token as an authenticated user.
```

```text
AS a user
I WANT to log-in to the service using my email address and password
SO THAT I can receive a JWT token that contains my details including the email address and role.
```

```text
AS a user having the mentor role
I WANT to log-in to the service using my email address and password
SO THAT I can see the navigation bar containing `/profile` and `/requests`.
```

```text
AS a user having the mentee role
I WANT to log-in to the service using my email address and password
SO THAT I can see the navigation bar containing `/profile`, `/mentors` and `/requests`.
```

### 3. 사용자 프로필

```text
AS a user
I WANT to be able to navigate to the `/profile` page
SO THAT I can see my details.
```

```text
AS a user having the mentor role
I WANT to be able to register my profile data including name, bio, image and tech skillsets
SO THAT mentees can see my details.
```

```text
AS a user having the mentee role
I WANT to be able to register my profile data including name, bio and image
SO THAT mentors can see my details.
```

```text
AS a user having the mentor role
I WANT to be able to show my default image with this URL, https://placehold.co/500x500.jpg?text=MENTOR
SO THAT mentees and I can see my profile image.
```

```text
AS a user having the mentee role
I WANT to be able to show my default image with this URL, https://placehold.co/500x500.jpg?text=MENTEE
SO THAT mentors and I can see my profile image.
```

```text
AS a user
I WANT to be able to upload an image from my local computer
SO THAT everyone can see my profile image.
```

```text
AS a user
I WANT to upload an image with the format of .png or .jpg.
```

```text
AS a user
I WANT to upload an image less than 1MB size
SO THAT I cannot upload the image larger than 1MB size.
```

### 4. 멘토 목록 조회

```text
AS a user having the mentee role
I WANT to navigate to the `/mentors` page
SO THAT I can see the list of the mentors.
```

```text
AS a user having the mentee role
I WANT to enter a search keyword around the tech skillsets on the `/mentors` page
SO THAT I can see the list of the mentors filtered by the keyword.
```

```text
AS a user having the mentee role
I WANT to be able to sort the list of mentors
SO THAT I can see the list of the mentors ordered by mentor name or tech skillsets.
```

### 5. 매칭 요청

```text
AS a user having the mentee role
I WANT to send a request to a mentor
SO THAT I can see the request status at the `/requests` page.
```

```text
AS a user having the mentee role
I WANT to send only one request to one mentor at a time
SO THAT I cannot send requests multiple times until the request is accepted or rejected.
```

```text
AS a user having the mentee role
I WANT to send a request to a mentor with a message
SO THAT the mentor can see my message.
```

### 6. 매칭 요청 수락/거절

```text
AS a user having the mentor role
I WANT to navigate to the `/requests` page
SO THAT I can see the list of requests from mentees.
```

```text
AS a user having the mentor role
I WANT to be able to accept or reject a request
SO THAT the mentee can see the request status updated.
```

```text
AS a user having the mentor role
I WANT to only accept one request from one mentee
SO THAT the other requests from the other mentees are automatically rejected.
```

### 7. 매칭 요청 목록

```text
AS a user having the mentee role
I WANT to see the request status
SO THAT I can check the request status.
```

```text
AS a user having the mentee role
I WANT to cancel a request to a mentor before being accepted or rejected
SO THAT the mentor cannot see my message.
```

## 테스트 가용성 고려사항

다음 HTML 엘리먼트는 반드시 UI 기능 테스트를 위해 ID 값을 갖춰야 합니다.

### 1. 회원가입

- email 인풋 필드: `id`=`email`
- password 인풋 필드: `id`=`password`
- role 인풋 필드: `id`=`role`
- signup 버튼: `id`=`signup`

### 2. 로그인

- email 인풋 필드: `id`=`email`
- password 인풋 필드: `id`=`password`
- login 버튼: `id`=`login`

### 3. 사용자 프로필

- name 인풋 필드: `id`=`name`
- bio 인풋 필드: `id`=`bio`
- skillsets 인풋 필드: `id`=`skillsets`
- profile 사진: `id`=`profile-photo`
- profile 사진 인풋 필드: `id`=`profile`
- save 버튼: `id`=`save`

### 4. 멘토 목록 조회

- 개별 멘토 엘리먼트: `class`=`mentor`
- 멘토 스킬셋 검색 인풋 필드: `id`=`search`
- 멘토 정렬 인풋 (이름): `id`=`name`
- 멘토 정렬 인풋 (스킬셋): `id`=`skill`

### 5. 매칭 요청

- 요청 메시지 인풋 필드: `id`=`message`, `data-mentor-id`=`{{mentor-id}}`, `data-testid`=`message-{{mentor-id}}`
- 요청 상태: `id`=`request-status`
- 요청 버튼: `id`=`request`

### 6. 매칭 요청 수락/거절

- 요청 메시지: `class`=`request-message`, `mentee`=`{{mentee-id}}`
- 수락 버튼: `id`=`accept`
- 거절 버튼: `id`=`reject`

### 7. 매칭 요청 목록


# 내부 결정 사항
- 1. 주요한 기술스택은 Nodejs로, 프론트엔드는 Svelte를, 백엔드는 Express를 사용하기로 하였다. 
- 2. monorepo이고, turbo를 사용한다.
- 3. 최종적으로 `npm run start`를 하면 빌드를 완료하고 이후 실행이 될 수 있게 워크플로우를 작성한다.
- 4. SQLite를 사용한다.
- 5. prisma를 사용하여 backend를 사용한다.
- 6. 테스팅은 일단 맨 처음이 완성되고 한다.