"""
Test script to verify password hashing fix for bcrypt 72-byte limit
"""
import sys
import os

# Set UTF-8 encoding for Windows console
if sys.platform == 'win32':
    os.system('chcp 65001 > nul')

sys.path.append('backend')

from app.utils import _prepare_password, get_password_hash, verify_password

def test_prepare_password():
    print("Testing _prepare_password function...")
    
    # Test short password
    short_pwd = "riyaaaaa"
    prepared = _prepare_password(short_pwd)
    assert prepared == short_pwd, f"Short password should remain unchanged: {prepared}"
    assert len(prepared.encode('utf-8')) <= 72, f"Prepared password should be <= 72 bytes"
    print(f"[PASS] Short password (8 chars): {short_pwd} -> {prepared}")
    
    # Test password at exactly 72 bytes
    pwd_72 = "a" * 72
    prepared_72 = _prepare_password(pwd_72)
    assert prepared_72 == pwd_72, "72-byte password should remain unchanged"
    print(f"[PASS] 72-byte password: unchanged")
    
    # Test password at 73 bytes (should be hashed)
    pwd_73 = "a" * 73
    prepared_73 = _prepare_password(pwd_73)
    assert prepared_73 != pwd_73, "73-byte password should be hashed"
    assert len(prepared_73.encode('utf-8')) <= 72, f"Hashed password should be <= 72 bytes, got {len(prepared_73.encode('utf-8'))}"
    print(f"[PASS] 73-byte password: hashed to {len(prepared_73)} chars")
    
    # Test very long password
    long_pwd = "This is a very long password that exceeds the 72 byte limit by a significant margin! " * 10
    prepared_long = _prepare_password(long_pwd)
    assert len(prepared_long.encode('utf-8')) <= 72, f"Long password should be hashed to <= 72 bytes"
    print(f"[PASS] Very long password ({len(long_pwd)} chars): hashed to {len(prepared_long)} chars")
    
    print("\n[SUCCESS] All _prepare_password tests passed!\n")

def test_hash_and_verify():
    print("Testing get_password_hash and verify_password...")
    
    # Test short password
    short_pwd = "riyaaaaa"
    hashed = get_password_hash(short_pwd)
    assert hashed is not None, "Hash should not be None"
    assert len(hashed) > 0, "Hash should not be empty"
    assert verify_password(short_pwd, hashed), "Password verification should succeed"
    print(f"[PASS] Short password: hash={hashed[:20]}..., verified=True")
    
    # Test long password
    long_pwd = "This is a very long password that exceeds the 72 byte limit! " * 10
    hashed_long = get_password_hash(long_pwd)
    assert hashed_long is not None, "Long password hash should not be None"
    assert verify_password(long_pwd, hashed_long), "Long password verification should succeed"
    print(f"[PASS] Long password: hash={hashed_long[:20]}..., verified=True")
    
    # Test that wrong password fails verification
    assert not verify_password("wrong_password", hashed), "Wrong password should fail verification"
    print(f"[PASS] Wrong password verification: failed (as expected)")
    
    print("\n[SUCCESS] All hash and verify tests passed!\n")

if __name__ == "__main__":
    try:
        test_prepare_password()
        test_hash_and_verify()
        print("=" * 50)
        print("[SUCCESS] ALL TESTS PASSED!")
        print("=" * 50)
    except Exception as e:
        print("=" * 50)
        print(f"[ERROR] TEST FAILED: {e}")
        print("=" * 50)
        import traceback
        traceback.print_exc()
        sys.exit(1)
