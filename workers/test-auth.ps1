$BASE = "http://localhost:8787"

# --- 1. Health Check ---
Write-Host "=== 1. Health Check ===" -ForegroundColor Cyan
try {
    Invoke-RestMethod "$BASE/api/health" | ConvertTo-Json
} catch {
    Write-Host "FAIL: $($_.Exception.Message)" -ForegroundColor Red
    return
}

# --- 2. Register (parent) ---
Write-Host "`n=== 2. Register (parent) ===" -ForegroundColor Cyan
$regBody = '{"username":"testparent","password":"test1234","display_name":"테스트부모","role":"parent","security_question":"좋아하는 색?","security_answer":"파랑"}'
try {
    $reg = Invoke-RestMethod -Method Post -Uri "$BASE/api/auth/register" -ContentType "application/json" -Body $regBody
    $reg | ConvertTo-Json -Depth 3
    $parentToken = $reg.access_token
    $parentUserId = $reg.user.user_id
    Write-Host "access_token: $($parentToken.Substring(0,20))..." -ForegroundColor Green
} catch {
    Write-Host "FAIL: $($_.Exception.Message)" -ForegroundColor Red
    $_.ErrorDetails.Message
}

# --- 3. Login ---
Write-Host "`n=== 3. Login ===" -ForegroundColor Cyan
$loginBody = '{"username":"testparent","password":"test1234"}'
try {
    $login = Invoke-RestMethod -Method Post -Uri "$BASE/api/auth/login" -ContentType "application/json" -Body $loginBody
    $parentToken = $login.access_token
    Write-Host "login OK, token: $($parentToken.Substring(0,20))..." -ForegroundColor Green
} catch {
    Write-Host "FAIL: $($_.Exception.Message)" -ForegroundColor Red
    $_.ErrorDetails.Message
}

# --- 4. Me (JWT) ---
Write-Host "`n=== 4. /auth/me (JWT) ===" -ForegroundColor Cyan
try {
    $me = Invoke-RestMethod -Uri "$BASE/api/auth/me" -Headers @{ Authorization = "Bearer $parentToken" }
    $me | ConvertTo-Json
} catch {
    Write-Host "FAIL: $($_.Exception.Message)" -ForegroundColor Red
    $_.ErrorDetails.Message
}

# --- 5. Create Family (JWT) ---
Write-Host "`n=== 5. Create Family (JWT) ===" -ForegroundColor Cyan
$famBody = '{"creator_display_name":"테스트부모","creator_role":"parent"}'
try {
    $fam = Invoke-RestMethod -Method Post -Uri "$BASE/api/families" -ContentType "application/json" -Body $famBody -Headers @{ Authorization = "Bearer $parentToken" }
    $fam | ConvertTo-Json -Depth 3
    $familyCode = $fam.family.family_code
    $familyId = $fam.family.family_id
    Write-Host "family_code: $familyCode" -ForegroundColor Green
} catch {
    Write-Host "FAIL: $($_.Exception.Message)" -ForegroundColor Red
    $_.ErrorDetails.Message
}

# --- 6. Get Family (JWT, protected) ---
Write-Host "`n=== 6. Get Family (JWT, protected) ===" -ForegroundColor Cyan
try {
    $getFam = Invoke-RestMethod -Uri "$BASE/api/families/$familyId" -Headers @{ Authorization = "Bearer $parentToken" }
    $getFam | ConvertTo-Json -Depth 3
    Write-Host "member_count: $($getFam.member_count)" -ForegroundColor Green
} catch {
    Write-Host "FAIL: $($_.Exception.Message)" -ForegroundColor Red
    $_.ErrorDetails.Message
}

# --- 7. Register child + Join Family ---
Write-Host "`n=== 7. Register child + Join Family ===" -ForegroundColor Cyan
$childRegBody = '{"username":"testchild","password":"test1234","display_name":"테스트자녀","role":"child"}'
try {
    $childReg = Invoke-RestMethod -Method Post -Uri "$BASE/api/auth/register" -ContentType "application/json" -Body $childRegBody
    $childToken = $childReg.access_token
    Write-Host "child registered, token: $($childToken.Substring(0,20))..." -ForegroundColor Green
} catch {
    Write-Host "FAIL: $($_.Exception.Message)" -ForegroundColor Red
    $_.ErrorDetails.Message
}

$joinBody = "{`"display_name`":`"테스트자녀`",`"role`":`"child`"}"
try {
    $join = Invoke-RestMethod -Method Post -Uri "$BASE/api/families/$familyCode/join" -ContentType "application/json" -Body $joinBody -Headers @{ Authorization = "Bearer $childToken" }
    $join | ConvertTo-Json -Depth 3
    Write-Host "joined: already_member=$($join.already_member)" -ForegroundColor Green
} catch {
    Write-Host "FAIL: $($_.Exception.Message)" -ForegroundColor Red
    $_.ErrorDetails.Message
}

# --- 8. Child: List Claims (JWT, protected) ---
Write-Host "`n=== 8. Child: List Claims (JWT) ===" -ForegroundColor Cyan
try {
    $claims = Invoke-RestMethod -Uri "$BASE/api/families/$familyId/claims" -Headers @{ Authorization = "Bearer $childToken" }
    $claims | ConvertTo-Json -Depth 2
    Write-Host "claims count: $($claims.claims.Count)" -ForegroundColor Green
} catch {
    Write-Host "FAIL: $($_.Exception.Message)" -ForegroundColor Red
    $_.ErrorDetails.Message
}

# --- 9. Token Refresh ---
Write-Host "`n=== 9. Token Refresh ===" -ForegroundColor Cyan
$refreshBody = "{`"refresh_token`":`"$($login.refresh_token)`"}"
try {
    $refreshed = Invoke-RestMethod -Method Post -Uri "$BASE/api/auth/refresh" -ContentType "application/json" -Body $refreshBody
    Write-Host "new access_token: $($refreshed.access_token.Substring(0,20))..." -ForegroundColor Green
} catch {
    Write-Host "FAIL: $($_.Exception.Message)" -ForegroundColor Red
    $_.ErrorDetails.Message
}

Write-Host "`n=== All Tests Done ===" -ForegroundColor Green
