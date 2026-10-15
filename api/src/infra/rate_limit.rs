use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};

#[derive(Clone)]
pub struct RateLimiter {
    limit: u32,
    window: Duration,
    buckets: Arc<Mutex<HashMap<String, (Instant, u32)>>>,
}

impl RateLimiter {
    pub fn new(limit: u32, window: Duration) -> Self {
        Self {
            limit,
            window,
            buckets: Arc::new(Mutex::new(HashMap::new())),
        }
    }

    pub fn per_minute(limit: u32) -> Self {
        Self::new(limit, Duration::from_secs(60))
    }

    pub fn check(&self, key: &str) -> Result<(), Duration> {
        self.check_at(key, Instant::now())
    }

    pub fn check_at(&self, key: &str, now: Instant) -> Result<(), Duration> {
        let mut buckets = match self.buckets.lock() {
            Ok(guard) => guard,
            Err(poisoned) => poisoned.into_inner(),
        };
        if buckets.len() > 10_000 {
            let window = self.window;
            buckets.retain(|_, (started, _)| now.duration_since(*started) < window);
        }
        let entry = buckets.entry(key.to_string()).or_insert((now, 0));
        if now.duration_since(entry.0) >= self.window {
            *entry = (now, 0);
        }
        if entry.1 >= self.limit {
            return Err(self.window.saturating_sub(now.duration_since(entry.0)));
        }
        entry.1 += 1;
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn eleventh_request_in_a_minute_is_rejected() {
        let limiter = RateLimiter::per_minute(10);
        let start = Instant::now();
        for _ in 0..10 {
            assert!(limiter.check_at("1.2.3.4", start).is_ok());
        }
        assert!(limiter.check_at("1.2.3.4", start).is_err());
        assert!(limiter.check_at("5.6.7.8", start).is_ok());
        assert!(
            limiter
                .check_at("1.2.3.4", start + Duration::from_secs(61))
                .is_ok()
        );
    }
}
